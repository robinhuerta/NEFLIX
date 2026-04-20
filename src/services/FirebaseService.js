import { storage, db } from '../firebaseConfig';
import { ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

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
      return movieSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isFirebase: true
      }));
    }

    // 2. Fallback: Listar directamente desde Storage (Lógica Auto-Poster)
    const listRef = ref(storage, '');
    const res = await listAll(listRef);
    
    const allFiles = res.items.map(item => item.name);
    const videos = res.items.filter(item => item.name.toLowerCase().endsWith('.mp4'));
    
    const videoData = await Promise.all(
      videos.map(async (item) => {
        const baseName = item.name.replace('.mp4', '');
        
        // Buscar poster con el mismo nombre (.jpg, .png, .webp)
        const possibleExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
        let posterUrl = '/posters/el-ultimo-guerrero-square.png'; // Default
        
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
 * Sube un video y su poster a Firebase Storage y guarda los metadatos en Firestore.
 */
export const uploadMovie = async (videoFile, posterFile, metadata, onProgress) => {
  try {
    // 1. Subir Video
    const videoRef = ref(storage, videoFile.name);
    const videoUploadTask = uploadBytesResumable(videoRef, videoFile);
    
    // 2. Subir Poster (si existe)
    let posterUrl = '';
    if (posterFile) {
      const posterRef = ref(storage, posterFile.name);
      await uploadBytesResumable(posterRef, posterFile);
      posterUrl = await getDownloadURL(posterRef);
    }

    // Monitorear progreso (simplificado para el video)
    videoUploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onProgress) onProgress(progress);
    });

    await videoUploadTask;
    const videoUrl = await getDownloadURL(videoRef);

    // 3. Guardar en Firestore
    const docRef = await addDoc(collection(db, 'movies'), {
      title: metadata.title || videoFile.name.replace('.mp4', ''),
      description: metadata.description || '',
      category: metadata.category || 'Novedades',
      fileName: videoFile.name,
      videoUrl: videoUrl,
      image: posterUrl || '/posters/el-ultimo-guerrero-square.png',
      createdAt: serverTimestamp(),
      maturity: metadata.maturity || '13+',
      duration: metadata.duration || '2h 00m'
    });

    return docRef.id;
  } catch (error) {
    console.error("Error en la subida masiva:", error);
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
