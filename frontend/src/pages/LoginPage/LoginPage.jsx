import React from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import LogoRedondo from '../../img/logo_redondo.png';
import '../../styles/LoginPage.css';

export const LoginPage = () => {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.message === 'login successful') {
        Swal.fire({
          icon: 'success',
          title: '¡Inicio de sesión exitoso!',
          text: `Bienvenido, ${result.userType}`,
          timer: 1500,
          showConfirmButton: false,
        });

        // Redirigir según el rol
        if (result.userType === 'Admin') {
          navigate('/admin-dashboard');
        } else if (result.userType === 'Coordinator') {
          navigate('/coordinator-dashboard');
        } else if (result.userType === 'Employee') {
          navigate('/employee-dashboard');
        }
      } else {
        // Mostrar el mensaje específico del backend
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: result.message || 'Ocurrió un error. Inténtalo de nuevo más tarde.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: 'Ocurrió un error. Inténtalo de nuevo más tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img
            src={LogoRedondo}
            alt="Instituto Técnico Ricaldone Logo"
            className="logo"
          />
          <h1 className="title">
            Bienvenido al Sistema de Control<br />
            de Acceso ITR
          </h1>
        </div>

        <p className="subtitle">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Correo electrónico institucional
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="Email"
              {...register("email", { 
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              })}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Contraseña"
              {...register("password", { required: true })}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cargando...' : <b>Iniciar sesión</b>}
          </button>
        </form>

        <div className="footer">
          <b>
            <p>Desarrollado por el departamento de Desarrollo de Software</p>
          </b>
          <b>
            <p>
              del <a href="https://www.ricaldone.edu.sv/" className="highlight">
                Instituto Técnico Ricaldone
              </a>
            </p>
          </b>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;