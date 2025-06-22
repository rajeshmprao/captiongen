export const imageService = {
  // Client-side image compression utility
  compressImage(file, maxSizeKB = 300) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce until size target is met
        let quality = 0.9;
        let compressed;
        
        do {
          compressed = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        } while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.1); // 1.37 accounts for base64 overhead
        
        resolve(compressed);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};
