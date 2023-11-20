document.getElementById('imageInput').addEventListener('change', handleImageSelect);

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('previewContainer');
            preview.innerHTML = `<img src="${e.target.result}" alt="Selected Image" id="selectedImage">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadAndCrop() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Image uploaded successfully. Image path: ${result.imagePath}`);
                loadGallery();
            } else {
                alert('Failed to upload image.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    } else {
        alert('Please select an image.');
    }
}

async function loadGallery() {
    try {
        const response = await fetch('/gallery');
        if (response.ok) {
            const result = await response.json();
            const galleryContainer = document.getElementById('galleryContainer');
            galleryContainer.innerHTML = '';

            result.images.forEach(imagePath => {
                galleryContainer.innerHTML += `<img src="${imagePath}" alt="Gallery Image" class="gallery-image">`;
            });
        } else {
            console.error('Failed to load gallery images.');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}
