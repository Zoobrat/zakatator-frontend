// ============================================
// ZAKATATOR.EXE - ПОЛНАЯ ВЕРСИЯ
// ============================================

console.log('🎁 ZAKATATOR.EXE запущен!');

const API_URL = 'https://zakatator.pythonanywhere.com';

// ============================================
// ЗАГРУЗКА ВИШЛИСТА
// ============================================

async function uploadWishlist() {
    const fileInput = document.getElementById('wishlist');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('🚫 Выбери файл!');
        return;
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('🚫 Файл слишком большой (макс 10MB)');
        return;
    }

    // Показываем прогресс
    document.querySelector('.upload-section').style.display = 'none';
    document.getElementById('progress').style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.gift) {
            showResult(data.gift);
        } else if (data.error) {
            showError(data.error);
        } else {
            showError('Не удалось обработать файл');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка сети: ' + error.message);
    }
}

// ============================================
// ПОКАЗАТЬ РЕЗУЛЬТАТ
// ============================================

function showResult(gift) {
    document.getElementById('progress').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('gift-text').textContent = gift;
    
    // Анимация появления
    const resultSection = document.getElementById('result');
    resultSection.style.opacity = '0';
    setTimeout(() => {
        resultSection.style.transition = 'opacity 0.5s';
        resultSection.style.opacity = '1';
    }, 100);
}

// ============================================
// ПОКАЗАТЬ ОШИБКУ
// ============================================

function showError(message) {
    document.getElementById('progress').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-text').textContent = message;
}

// ============================================
// СБРОС ПРИЛОЖЕНИЯ
// ============================================

function resetApp() {
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('wishlist').value = '';
}

// ============================================
// ДОП ФУНКЦИИ (если нужны)
// ============================================

// Drag & Drop
function initDragDrop() {
    const dropZone = document.querySelector('.upload-section');
    
    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#667eea';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#e2e8f0';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e2e8f0';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('wishlist').files = files;
        }
    });
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM загружен!');
    initDragDrop();
});

// Экспорт функций (для onclick в HTML)
window.uploadWishlist = uploadWishlist;
window.resetApp = resetApp;
