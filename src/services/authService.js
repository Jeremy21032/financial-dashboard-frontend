// Servicio de autenticación y gestión de roles

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Usuarios de ejemplo (en producción esto vendría del backend)
export const USERS = [
  {
    email: 'admin@financial.com',
    password: 'admin123',
    name: 'Administrador',
    role: ROLES.ADMIN
  },
  {
    email: 'user@financial.com',
    password: 'user123',
    name: 'Usuario Regular',
    role: ROLES.USER
  }
];

export const login = async (email, password) => {
  // Simulación de login (en producción esto sería una llamada al backend)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = USERS.find(u => u.email === email && u.password === password);
      
      if (user) {
        const token = `token_${user.role}_${Date.now()}`;
        resolve({
          token,
          user: {
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } else {
        reject(new Error('Credenciales inválidas'));
      }
    }, 1000);
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  return user && user.role === requiredRole;
};

export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
};

export const isAdmin = () => {
  return hasRole(ROLES.ADMIN);
};

