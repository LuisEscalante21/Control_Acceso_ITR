import { useState } from "react";
import { useForm } from "react-hook-form";
import useDataRecoveryPass from "../../../hooks/Global/useDataRecovery";
import "../PageModalStyles/NewPass.css";
import Swal from "sweetalert2";

export default function RecoveryPasswordModal({ open, onClose, onVerified }) {
  const { loading, requestCode, verifyCode } = useDataRecoveryPass();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ mode: "onTouched" });

  if (!open) return null;

  const handleRequest = async ({ email }) => {
    const res = await requestCode({ email }); //ahora por correo
    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Código enviado",
        text: "Revisa tu correo para continuar.",
        timer: 1800,
        showConfirmButton: false,
      });
      setStep(2);
      reset();
    } else {
      Swal.fire({
        icon: "error",
        title: "No se pudo enviar",
        text: res.error || "Inténtalo nuevamente.",
      });
    }
  };

  const handleVerify = async ({ code }) => {
    const res = await verifyCode({ code });
    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Código verificado",
        timer: 1200,
        showConfirmButton: false,
      });
      onVerified?.(); // abre el modal NewPass en el padre
      onClose?.();
    } else {
      Swal.fire({
        icon: "error",
        title: "Código inválido",
        text: res.error || "Verifica el código ingresado.",
      });
    }
  };

  return (
    <div className="np-overlay np-fade-in">
      <div className="np-card np-scale-in">
        {step === 1 && (
          <>
            <h2 className="np-title">Recuperar contraseña</h2>
            <p className="np-subtitle">Ingresa tu correo institucional</p>

            <form onSubmit={handleSubmit(handleRequest)}>
              <div className="input-group" style={{ marginTop: 12 }}>
                <label className="input-label">Correo electrónico</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Requerido",
                    pattern: {
                      value:
                        // RFC 5322 simplificado
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Formato inválido",
                    },
                  })}
                />
                {errors.email && (
                  <span className="np-error">{errors.email.message}</span>
                )}
              </div>

              <div className="np-actions">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading || isSubmitting}
                  style={{ flex: 1 }}
                >
                  {loading || isSubmitting ? "Enviando..." : <b>Enviar código</b>}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="login-button"
                  style={{ width:"100px",backgroundColor: "#ffffffff", color: "#548affff", marginLeft: 8 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="np-title">Verificar código</h2>
            <p className="np-subtitle">Ingresa el código que recibiste en tu correo</p>

            <form onSubmit={handleSubmit(handleVerify)}>
              <div className="input-group" style={{ marginTop: 12 }}>
                <label className="input-label">Código</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. 123456"
                  {...register("code", {
                    required: "Requerido",
                    minLength: { value: 4, message: "Mínimo 4 dígitos" },
                  })}
                />
                {errors.code && (
                  <span className="np-error">{errors.code.message}</span>
                )}
              </div>

              <div className="np-actions">
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading || isSubmitting}
                  style={{ flex: 1 }}
                >
                  {loading || isSubmitting ? "Verificando..." : <b>Verificar</b>}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="login-button" 
                  style={{ width:"100px",backgroundColor: "#ffffffff", color: "#548affff", marginLeft: 8 }}
                >
                  Volver
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
