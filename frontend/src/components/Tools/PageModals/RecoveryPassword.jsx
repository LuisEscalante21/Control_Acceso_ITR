// src/components/Tools/PageModals/RecoveryPassword.jsx
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import useDataRecoveryPass from "../../../hooks/Global/useDataRecovery";
import "../PageModalStyles/RecoveryPassword.css";

const domainRegex = /^[a-zA-Z0-9._%+-]+@ricaldone\.edu\.sv$/;
const empCodeRegex = /^[A-Za-z0-9-_]+$/; // ajusta si tu código acepta otros símbolos

export default function RecoveryPasswordModal({ open, onClose }) {
  const { loading, submitRecovery } = useDataRecoveryPass();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { email: "", numEmpleado: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values) => {
    const email = values.email.trim();
    const numEmpleado = values.numEmpleado.trim();
    if (!email || !numEmpleado) return; // guardia extra

    // 1) cerramos el modal inmediato
    onClose?.();

    // 2) pequeña espera para que React desmonte el modal antes de mostrar el loader
    await new Promise((r) => setTimeout(r, 50));

    // 3) modal de espera
    Swal.fire({
      title: "Enviando solicitud…",
      html: "Por favor, espera un momento.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const result = await submitRecovery({ email, numEmpleado });

      // 4) cerramos loader y mostramos resultado
      Swal.close();

      if (result.ok) {
        await Swal.fire({
          icon: "success",
          title: "Solicitud enviada",
          text:
            "Si los datos coinciden, recibirás una contraseña temporal por correo.",
          confirmButtonText: "Entendido",
        });
        reset();
      } else {
        await Swal.fire({
          icon: "error",
          title: "No se pudo enviar",
          text: result.error || "Intenta de nuevo más tarde.",
          confirmButtonText: "Ok",
        });
      }
    } catch (e) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: e?.message || "Intenta más tarde.",
        confirmButtonText: "Ok",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="rp-overlay rp-fade-in">{/* No cierra al click fuera */}
      <div className="rp-card rp-scale-in">
        {/* Botón X */}
        <button
          onClick={() => !loading && onClose?.()}
          disabled={loading}
          aria-label="Cerrar"
          className="rp-close"
          type="button"
        >
          <X size={20} />
        </button>

        <h2 className="rp-title">Recuperar contraseña</h2>
        <p className="rp-subtitle">
          Ingresa tu <b>correo institucional</b> y tu <b>código de empleado</b>.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email (obligatorio) */}
          <div className="input-group" style={{ marginTop: 12 }}>
            <label htmlFor="recovery-email" className="input-label">
              Correo institucional
            </label>
            <input
              id="recovery-email"
              type="email"
              placeholder="tu@ricaldone.edu.sv"
              className="input-field"
              disabled={loading || isSubmitting}
              {...register("email", {
                required: "El correo es requerido",
                pattern: {
                  value: domainRegex,
                  message: "Usa tu correo institucional @ricaldone.edu.sv",
                },
              })}
            />
            {errors.email && (
              <span className="rp-error">{errors.email.message}</span>
            )}
          </div>

          {/* Código de empleado (obligatorio) */}
          <div className="input-group" style={{ marginTop: 12 }}>
            <label htmlFor="recovery-numEmpleado" className="input-label">
              Código de empleado
            </label>
            <input
              id="recovery-numEmpleado"
              type="text"
              placeholder="Ej: RL01"
              className="input-field"
              disabled={loading || isSubmitting}
              {...register("numEmpleado", {
                required: "El código de empleado es requerido",
                minLength: { value: 3, message: "Mínimo 3 caracteres" },
                pattern: {
                  value: empCodeRegex,
                  message: "Solo letras, números, '-' o '_'",
                },
              })}
            />
            {errors.numEmpleado && (
              <span className="rp-error">{errors.numEmpleado.message}</span>
            )}
          </div>

          <div className="rp-actions">
            <button
              type="submit"
              className="login-button"
              disabled={loading || isSubmitting}
              style={{ flex: 1 }}
            >
              {loading || isSubmitting ? "Enviando..." : <b>Enviar</b>}
            </button>
          </div>
        </form>

        <p className="rp-hint">
          Verifica que tu <b>correo</b> y <b>código</b> estén escritos tal cual en el sistema.
        </p>
      </div>
    </div>
  );
}
