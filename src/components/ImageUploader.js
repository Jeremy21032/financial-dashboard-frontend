import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPaymentImageUrl } from '../services/api';

const ImageUploader = ({ onUpload, value }) => {
  const [imagePreview, setImagePreview] = useState(value || '');
  const containerRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!file || !(file instanceof Blob)) {
      message.error('Archivo no válido');
      return false;
    }

    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Solo puedes subir archivos JPG o PNG');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB');
      return false;
    }

    return true;
  }, []);

  const convertToJpegBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imgElement = new window.Image();
        imgElement.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);
            const jpegData = canvas.toDataURL('image/jpeg', 0.92);
            resolve(jpegData);
          } catch (error) {
            reject(error);
          }
        };
        imgElement.onerror = (err) => reject(err);
        imgElement.src = reader.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }, []);

  const processFile = useCallback(
    async (file) => {
      if (!file || !validateFile(file)) return;

      try {
        const jpegBase64 = await convertToJpegBase64(file);
        setImagePreview(jpegBase64);
        onUpload(jpegBase64);
      } catch (error) {
        console.error('Error convirtiendo la imagen a JPEG:', error);
        message.error('No se pudo procesar la imagen. Intenta con otro archivo.');
      }
    },
    [convertToJpegBase64, onUpload, validateFile]
  );

  const handleImageChange = useCallback((info) => {
    const file = info?.file?.originFileObj || info?.file;

    if (!file) {
      console.warn('Archivo no válido:', info?.file);
      return;
    }

    processFile(file);
  }, [processFile]);

  const handleRemove = () => {
    setImagePreview('');
    onUpload('');
  };

  const beforeUpload = useCallback((file) => {
    if (!validateFile(file)) {
      return Upload.LIST_IGNORE;
    }
    // Prevenimos el upload automático, procesamos en onChange
    return false;
  }, [validateFile]);

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData?.items;
    if (!items || !items.length) {
      return;
    }

    const imageItem = Array.from(items).find((item) =>
      item.type && item.type.startsWith('image/')
    );

    if (!imageItem) {
      message.warning('No se encontró ninguna imagen en el portapapeles');
      return;
    }

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (file) {
      processFile(file);
      message.success('Imagen pegada desde el portapapeles');
    } else {
      message.warning('No se encontró ninguna imagen válida en el portapapeles');
    }
  }, [processFile]);

  // Sincronizar el valor externo con el preview interno
  useEffect(() => {
    if (value) {
      setImagePreview(value);
    } else {
      setImagePreview('');
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      onPaste={handlePaste}
      tabIndex={0}
      onClick={() => containerRef.current?.focus()}
    >
      <Upload
        beforeUpload={beforeUpload}
        onChange={handleImageChange}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>Subir Imagen</Button>
      </Upload>
      <span style={{ fontSize: 12, color: '#666' }}>
        También puedes pegar una imagen directamente desde el portapapeles (Ctrl/Cmd + V).
      </span>
      
      {imagePreview && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={getPaymentImageUrl(imagePreview) || imagePreview}
            alt="Preview"
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              borderRadius: '50%',
              width: 24,
              height: 24,
              minWidth: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;