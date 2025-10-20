# 💼 Financial Dashboard Admin

Dashboard administrativo para la gestión financiera de estudiantes y cursos.

## 🚀 Características

- ✅ **Login con Roles** - Sistema de autenticación (Admin/Usuario)
- ✅ **Dashboard Interactivo** - Estadísticas financieras por curso
- ✅ **Gestión de Estudiantes** - CRUD completo por curso
- ✅ **Gestión de Pagos** - Registro con comprobantes de pago
- ✅ **Gestión de Gastos** - Control de gastos con categorías
- ✅ **Gestión de Categorías** - Categorías personalizadas por curso
- ✅ **Selector de Curso** - Cambio dinámico entre cursos
- ✅ **Diseño Responsive** - Funciona en desktop, tablet y mobile
- ✅ **Interfaz Moderna** - UI profesional con Ant Design

## 🛠️ Tecnologías

- **React 19** - Framework de JavaScript
- **React Router DOM** - Navegación
- **Ant Design** - Componentes UI
- **Axios** - Cliente HTTP
- **Moment.js** - Manejo de fechas
- **CSS3** - Estilos personalizados

## 📱 Páginas Disponibles

### 🔐 Login
- Autenticación con email y contraseña
- Roles diferenciados (Admin/Usuario)
- Credenciales demo incluidas

### 📊 Dashboard
- Estadísticas financieras por curso
- Gráficos de pagos y gastos
- Tabla de gastos por estudiante

### 👥 Estudiantes
- Lista de estudiantes por curso
- Búsqueda y filtrado
- Gestión completa CRUD

### 💰 Pagos
- Registro de pagos con comprobantes
- Filtros por período y estado
- Subida de imágenes

### 💸 Gastos
- Registro de gastos por categorías
- Múltiples imágenes por gasto
- Filtros por categoría

### ⚙️ Configuraciones
- Gestión de categorías por curso
- Montos base configurables

## 🔧 Instalación Local

1. **Clonar el repositorio**:
   ```bash
   git clone [url-del-repo]
   cd financial-dashboard-admin
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con dataset de tu backend
   ```

4. **Ejecutar la aplicación**:
   ```bash
   npm start
   ```

5. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 🌐 Despliegue en Vercel

El frontend está configurado para desplegarse automáticamente en Vercel:

- **Configuración**: `vercel.json` incluido
- **Build**: `npm run build` automático
- **Variables de entorno**: Configuradas en Vercel Dashboard

### Variables de Entorno Requeridas:
```env
REACT_APP_API_URL=https://financial-dashboard-backend.vercel.app/api
```

## 🎨 Características de Diseño

### 📱 Responsive Design
- **Desktop**: Layout completo con sidebar
- **Tablet**: Adaptación automática
- **Mobile**: Menú hamburguesa y navegación optimizada

### 🎯 UX/UI
- **Ant Design**: Componentes profesionales
- **Animaciones**: Transiciones suaves
- **Colores**: Paleta coherente y moderna
- **Tipografía**: Legible y jerárquica

## 🔐 Credenciales Demo

### Usuario Admin:
- **Email**: admin@demo.com
- **Contraseña**: admin123

### Usuario Regular:
- **Email**: user@demo.com
- **Contraseña**: user123

## 📊 Funcionalidades por Rol

### 👑 Admin
- ✅ Acceso completo a todas las funcionalidades
- ✅ Gestión de cursos, estudiantes, pagos, gastos
- ✅ Configuración del sistema

### 👤 Usuario
- ✅ Acceso limitado según configuración
- ✅ Visualización de datos asignados

## 🚀 Scripts Disponibles

- `npm start` - Iniciar en modo desarrollo
- `npm run build` - Construir para producción
- `npm test` - Ejecutar tests
- `npm run eject` - Ejectar configuración (no recomendado)

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas principales
├── context/            # Context API (CourseContext)
├── services/           # Servicios (API, Auth)
├── utils/              # Utilidades
└── styles/             # Estilos CSS
```

## 🔗 Integración con Backend

- **API Base**: Configurable via `REACT_APP_API_URL`
- **Autenticación**: JWT tokens
- **CORS**: Habilitado en backend
- **Endpoints**: RESTful API

## 📞 Soporte

Para soporte técnico o reportar bugs, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para la gestión financiera educativa**