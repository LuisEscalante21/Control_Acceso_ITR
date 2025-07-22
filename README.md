# Sistema de Registro Ricaldone

## Integrantes del Equipo
- **Luis Ernesto Escalante Calderón** — *Coordinador*
- **Luis David Domínguez Amaya** — *Subcoordinador*
- **Alan Alberto Rivas León** — *Secretario*
- **Daniel Oswaldo Brizuela Alberto** — *Tesorero*
- **Robbie Fernando Larios Orellana** — *Vocal*

---

## Descripción del Proyecto
**Sistema de Registro Ricaldone** es una solución empresarial de control de acceso que utiliza reconocimiento facial tipo **Face ID**.  
El objetivo principal es registrar de manera automatizada:
- La **hora de entrada** del personal.
- La **hora de salida**.
- Las **justificaciones** por llegadas tardías.
- Las **solicitudes de permiso** por ausencias o salidas anticipadas.

Este sistema busca optimizar la gestión del recurso humano y ofrecer mayor precisión en el control de asistencia.

---

## Tecnologías Utilizadas
El sistema está desarrollado con el stack **MERN**, el cual permite una integración eficiente entre front-end, back-end y base de datos:
- **MongoDB** — Base de datos NoSQL para almacenamiento.
- **Express.js** — Framework para la creación de APIs.
- **React.js** — Interfaz de usuario web.
- **Node.js** — Servidor y lógica del back-end.

### Librerías y herramientas adicionales:
- **React Native** — Para el desarrollo móvil.
- **Tailwind CSS** — Estilización moderna y responsiva.
- **Tamagui**  
- **Shadcn/ui**  
- **GSAP** — Animaciones fluidas con JavaScript.
- **Framer Motion** — Animaciones en React.
- **AceternityUI**  
- **MagicUI**  
- **OriginUI**

---

## Comandos para el proyecto
Este proyecto se divide en dos partes principales: el **backend (Python)** y backend **frontend (MERN Stack)**. A continuación se detallan los pasos para instalar y ejecutar cada parte.

---

### 1. **Backend (Python)**
### Dependencias utilizadas:
- opencv-python
- numpy
- pillow
- face_recognition
- pymongo
- flask
- flask_cors
- dlib
- flask-cors
  

***Nota:***  
Para que todo funcione correctamente es necesario usar la versión de python 3.11  
[Descargar Python 3.11.13](https://www.python.org/downloads/release/python-31113/)

***Software adicional:***

[CMake](https://cmake.org/)
[Visual Studio IDE](https://visualstudio.microsoft.com/es/vs/features/cplusplus/)

#### Instalar dependencias
Para instalar todas las dependencias de la api en Python, asegúrate de estar en el directorio donde se encuentra el archivo `requirements.txt`, y luego ejecuta el siguiente comando en tu terminal:
```bash
pip install -r requirements.txt
````
Para poder ejecutar el backend de python con la api se debe de ejecutar el app.py ya sea por comando o con la extesion de python
```bash
python App.py
````

### 2. **Backend (MERN)**:

### Dependencias utilizadas:
- bcryptjs ^3.0.2
- cloudinary ^1.30.0
- cookie-parser ^1.4.7
- cors ^2.8.5
- crypto ^1.0.1
- dotenv ^16.5.0
- express ^5.1.0
- jsonwebtoken ^9.0.2
- mongoose ^7.8.7
- multer ^2.0.1
- multer-storage-cloudinary ^4.0.0
- node-fetch ^3.3.2
- nodemailer ^6.10.1
- swagger-ui-express ^5.0.1
- validator ^13.15.15
  
**DevDependencies:**
- nodemon ^3.1.10

***Interpretador de javascript en el visual***
[Nodemon](https://nodejs.org/en)

**Instalar depedencias:**
```bash
npm i
````

**Ejecutar consola:**
````bash
node index.js
````

### 3. **Frontend (React)**:

**Dependencias utilizadas:**
- axios ^1.9.0
- dotenv ^16.6.1
- install ^0.13.0
- lucide-react ^0.511.0
- npm ^11.4.2
- react ^19.0.0
- react-chartjs-2 ^5.3.0
- react-dom ^19.0.0
- react-hook-form ^7.60.0
- react-icons ^5.5.0
- react-router-dom ^7.6.0
- react-select ^5.10.1
- sweetalert2 ^11.21.0
  
**DevDependencies:**
- @eslint/js ^9.22.0
- @types/react ^19.0.10
- @types/react-dom ^19.0.4
- @vitejs/plugin-react ^4.3.4
- autoprefixer ^10.4.21
- eslint ^9.22.0
- eslint-plugin-react-hooks ^5.2.0
- eslint-plugin-react-refresh ^0.4.19
- globals ^16.0.0
- postcss ^8.5.3
- tailwindcss ^4.1.6
- vite ^6.3.1

**Instalar depedencias:**
```bash
npm i
````
**Ejecutar consola:**
````bash
npm run dev
````

### 4. **Data Base (Mongo)**:
[MongoDB](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.11-signed.msi)

> Proyecto desarrollado con fines académicos para el Instituto Ricaldone.
