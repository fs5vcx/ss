const API_BASE = '/api/files';

export async function getFileList() {
  const res = await fetch(API_BASE);
  return res.json();
}

export async function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload error'));
    });

    xhr.open('POST', `${API_BASE}/upload`);
    xhr.send(formData);
  });
}

export async function deleteFile(fileName) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(fileName)}`, {
    method: 'DELETE'
  });
  return res.json();
}

export function getDownloadUrl(fileName) {
  return `${API_BASE}/download/${encodeURIComponent(fileName)}`;
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}
