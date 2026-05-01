import { storage, db } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';


const DEFAULT_POSTER = '/posters/el-ultimo-guerrero-square.png';

/**
 * Obtiene la lista completa de videos de COSMOS.
 * Primero intenta cargar desde Firestore (Metadatos ricos).
 * Si falla o no hay datos, cae a la lista de Storage con lógica de Auto-Poster.
 */
export const fetchAllVideos = async () => {
  try {
    // 1. Intentar obtener desde Firestore "movies"
    const moviesCol = collection(db, 'movies');
    const q = query(moviesCol, orderBy('createdAt', 'desc'));
    const movieSnapshot = await getDocs(q);
    
    if (!movieSnapshot.empty) {
      return movieSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const image = (data.image && data.image !== '') ? data.image : DEFAULT_POSTER;

        return {
          id: docSnap.id,
          ...data,
          image,
          isFirebase: true
        };
      });
    }

    // 2. Fallback: Listar directamente desde Storage (Lógica Auto-Poster)
    const listRef = ref(storage, '');
    const res = await listAll(listRef);
    
    const allFiles = res.items.map(item => item.name);
    const videos = res.items.filter(item => {
      const name = item.name.toLowerCase();
      return name.endsWith('.mp4') || name.endsWith('.mp3');
    });
    
    const videoData = await Promise.all(
      videos.map(async (item) => {
        const baseName = item.name.replace(/\.(mp4|mp3)$/i, '');
        
        // Buscar poster con el mismo nombre (.jpg, .png, .webp)
        const possibleExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
        let posterUrl = DEFAULT_POSTER;
        
        for (const ext of possibleExtensions) {
          if (allFiles.includes(baseName + ext)) {
            posterUrl = await getDownloadURL(ref(storage, baseName + ext));
            break;
          }
        }

        return {
          id: item.fullPath,
          title: baseName.replace(/_/g, ' ').replace(/-/g, ' '),
          fileName: item.name,
          image: posterUrl,
          isFirebase: true
        };
      })
    );
    
    return videoData;
  } catch (error) {
    console.error("Error al obtener videos de COSMOS:", error);
    return [];
  }
};

/**
 * Guarda o sube una película a Firebase.
 * videoFileOrUrl puede ser un Objeto File (subida a Storage) o un String (URL externa/YouTube).
 */
export const uploadMovie = async (videoFileOrUrl, posterFile, metadata, onProgress) => {
  try {
    let videoUrl = '';
    let fileName = '';
    let isExternal = false;

    // 1. Manejar Video (Subida o URL Directa)
    if (typeof videoFileOrUrl === 'string') {
      videoUrl = videoFileOrUrl;
      isExternal = true;
      fileName = 'External Link'; // Para indicar que no está en Storage
    } else if (videoFileOrUrl) {
      // Subir Video a Storage
      const videoRef = ref(storage, videoFileOrUrl.name);
      const videoUploadTask = uploadBytesResumable(videoRef, videoFileOrUrl);
      
      // Monitorear progreso
      videoUploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      });

      await videoUploadTask;
      videoUrl = await getDownloadURL(videoRef);
      fileName = videoFileOrUrl.name;
    }

    // 2. Subir Poster (si existe)
    let posterUrl = '';
    if (posterFile) {
      const posterRef = ref(storage, posterFile.name);
      await uploadBytesResumable(posterRef, posterFile);
      posterUrl = await getDownloadURL(posterRef);
    }

    // 3. Guardar en Firestore
    const docRef = await addDoc(collection(db, 'movies'), {
      title: metadata.title || (isExternal ? 'Nueva Película' : fileName.replace(/\.(mp4|mp3)$/i, '')),
      description: metadata.description || '',
      category: metadata.category || 'Novedades',
      genre: metadata.genre || '',
      artist: metadata.artist || '',
      isAudio: !isExternal && (typeof videoFileOrUrl !== 'string') && videoFileOrUrl?.type?.startsWith('audio/'),
      fileName: fileName,
      videoUrl: videoUrl,
      image: posterUrl || DEFAULT_POSTER,
      createdAt: serverTimestamp(),
      maturity: metadata.maturity || '13+',
      duration: metadata.duration || '2h 00m',
      isExternal: isExternal
    });

    return docRef.id;
  } catch (error) {
    console.error("Error en el proceso de guardado/subida:", error);
    throw error;
  }
};

/**
 * Elimina una película de Firestore y sus archivos asociados de Storage.
 */
export const deleteMovie = async (movieId, fileName, posterUrl) => {
  try {
    // 1. Borrar de Firestore
    if (movieId) {
      await deleteDoc(doc(db, 'movies', movieId));
    }

    // 2. Borrar Video de Storage
    if (fileName) {
      const videoRef = ref(storage, fileName);
      await deleteObject(videoRef).catch(err => console.warn("Video no encontrado en Storage:", err));
    }

    // 3. Borrar Poster de Storage (si no es el default)
    if (posterUrl && posterUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const posterRef = ref(storage, posterUrl);
        await deleteObject(posterRef);
      } catch (err) {
        console.warn("No se pudo borrar el poster de Storage:", err);
      }
    }

    return true;
  } catch (error) {
    console.error("Error al eliminar película de COSMOS:", error);
    throw error;
  }
};
