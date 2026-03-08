// src/utils/imageCompressor.js

/**
 * Compresses an image file using the browser's HTML5 Canvas.
 * @param {File} file - The original image file
 * @param {number} maxWidth - Max width (default 1920px)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 * @returns {Promise<File>} - The compressed file
 */
export const compressImage = (file, maxWidth = 1920, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // 1. Check if it's actually an image
    if (!file.type.match(/image.*/)) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // 2. Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // 3. Draw to Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Export as compressed JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Compression failed'));
            }
            // Create new File object with same name
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
           
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};