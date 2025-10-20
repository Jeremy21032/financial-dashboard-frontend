import React, { useState } from 'react';
import { Upload, Button, Image, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const ImageUploader = ({ onUpload, value }) => {
  const [imagePreview, setImagePreview] = useState(value || '');

  const handleImageChange = (info) => {
    const { file } = info;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setImagePreview(base64Image);
        onUpload(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setImagePreview('');
    onUpload('');
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Solo puedes subir archivos JPG/PNG!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Upload
        beforeUpload={beforeUpload}
        onChange={handleImageChange}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>Subir Imagen</Button>
      </Upload>
      
      {imagePreview && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Image
            src={imagePreview}
            alt="Preview"
            style={{ width: 100, height: 100, objectFit: 'cover' }}
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