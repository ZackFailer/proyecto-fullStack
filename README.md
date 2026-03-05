# 🚀 Modern Admin Dashboard (MEAN Stack)

Este es un proyecto de **Panel Administrativo Integral** desarrollado como una práctica avanzada para perfeccionar mi dominio en el stack **MEAN**. El objetivo es construir una herramienta robusta, escalable y moderna para la gestión empresarial, aplicando las últimas versiones de cada tecnología.

---

## 🛠️ Tecnologías y Herramientas

El proyecto utiliza una arquitectura desacoplada con versiones de vanguardia:

### **Frontend (Angular 21)**
* **Framework:** Angular v21.2.0 (Signals & Standalone components).
* **UI Components:** [PrimeNG v21](https://primeng.org/) & PrimeIcons.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) con el plugin `@tailwindcss/postcss`.
* **Temas:** `@primeuix/themes` para un modo oscuro/claro nativo.
* **Unit Testing:** Vitest & Jsdom.

### **Backend (Node.js & Express 5)**
* **Runtime:** Node.js con TypeScript.
* **Framework:** Express v5.2.1.
* **Autenticación:** JSON Web Tokens (JWT) y Bcryptjs para el hashing de contraseñas.
* **Base de Datos:** MongoDB (Persistencia de datos escalable).
* **Herramientas de Desarrollo:** `tsx` y `nodemon` para un flujo de trabajo ágil.

---

## ✨ Características (Features)

El panel está diseñado para cubrir las necesidades operativas de una empresa. Actualmente en desarrollo:

* 👥 **Gestión de Usuarios:** Control de acceso y perfiles.
* 📦 **Inventario y Productos:** Catálogo completo con stock en tiempo real.
* 📥 **Carga Masiva:** Importación optimizada de productos mediante archivos.
* 🤝 **Clientes y Proveedores:** Gestión de relaciones comerciales.
* ⚖️ **Auditoría y Conciliaciones:** Registro de movimientos y balance de cuentas.
* 📜 **Historial:** Trazabilidad completa de las acciones realizadas en el sistema.

---

## 🔑 Credenciales de Acceso

Para probar las funcionalidades del panel sin necesidad de crear una cuenta nueva, puedes utilizar el siguiente usuario administrativo:

> [!IMPORTANT]
> **Usuario de Administrador:**
> - **Correo:** `ejemplo@gmail.com`
> - **Password:** `123456`

---

## ⚙️ Instalación Local

### Requisitos previos
- Node.js (Versión recomendada 20+)
- MongoDB corriendo localmente o en la nube (Atlas)

### 1. Clonar el proyecto
```bash
git clone https://github.com/ZackFailer/proyecto-fullStack.git
cd nombre-del-repo
```

### 2. Configurar Backend
```Bash

cd backend
npm install
# Crea un archivo .env con tus variables (PORT, MONGO_URI, JWT_SECRET)
npm run dev
```

### 3. Configurar Frontend
```Bash

cd frontend
npm install
npm start
```

---

## 📈 Estado del Proyecto

Este proyecto es una práctica personal para dominar el flujo completo de datos desde la base de datos hasta la interfaz de usuario. Se añaden mejoras y refactorizaciones constantemente para mantener el código limpio y eficiente.

Desarrollado con dedicación por ZackFailer
