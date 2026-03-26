import { storage } from '../firebaseConfig';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

/**
 * Obtiene la lista de videos (.mp4) desde el root de Firebase Storage.
 */
export const fetchAllVideos = async () => {
  try {
    const listRef = ref(storage, ''); // Root directory
    const res = await listAll(listRef);
    
    const videoData = await Promise.all(
      res.items
        .filter(item => item.name.toLowerCase().endsWith('.mp4'))
        .map(async (item) => {
          return {
            id: item.fullPath,
            title: item.name.replace('.mp4', '').replace(/_/g, ' '),
            fileName: item.name,
            thumbnail: '/posters/el-ultimo-guerrero.png', // Placeholder premium
            isFirebase: true
          };
        })
    );
    
    return videoData;
  } catch (error) {
    console.error("Error al listar videos de Firebase:", error);
    return [];
  }
};
