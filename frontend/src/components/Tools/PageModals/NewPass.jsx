import { useForm } from "react-hook-form";
import useDataNewPass from "../../../hooks/Global/useDataNewPass";
import "../PageModalStyles/NewPass.css";

/**
 * Reglas en FE (deben coincidir con el BE):
 * - Mínimo 8
 * - Al menos 1 mayúscula, 1 minúscula, 1 dígito
 * - Permite símbolos (no se restringe set), pero NO permite espacios
 */
const noSpaces = /^\S+$/;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasDigit = /[0-9]/;

export default function NewPass({ open, onSuccess }) {
  const { loading, submitNewPass } = useDataNewPass();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  });

  const pwd = watch("password");

  const onSubmit = async (v) => {
    if (v.password !== v.confirm) return;
    const res = await submitNewPass(v.password);
    if (res.ok) {
      onSuccess?.();
    } else {
      alert(res.error || "No se pudo actualizar la contraseña");
    }
  };

  if (!open) return null;

  return (
    <div className="np-overlay np-fade-in">
      <div className="np-card np-scale-in">
        <h2 className="np-title">Actualizar contraseña</h2>
        <p className="np-subtitle">
          Debes cambiar tu contraseña temporal antes de continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label className="input-label">Nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              autoComplete="new-password"
              {...register("password", {
                required: "Requerida",
                minLength: { value: 8, message: "Mínimo 8 caracteres" },
                validate: {
                  noSpaces: (v) => noSpaces.test(v) || "No se permiten espacios",
                  upper: (v) => hasUpper.test(v) || "Debe tener al menos una mayúscula",
                  lower: (v) => hasLower.test(v) || "Debe tener al menos una minúscula",
                  digit: (v) => hasDigit.test(v) || "Debe tener al menos un número",
                },
              })}
            />
            {errors.password && <span className="np-error">{errors.password.message}</span>}
          </div>

          <div className="input-group" style={{ marginTop: 12 }}>
            <label className="input-label">Confirmar contraseña</label>
            <input
              type="password"
              className="input-field"
              autoComplete="new-password"
              {...register("confirm", {
                required: "Requerida",
                validate: (v) => v === pwd || "No coincide",
              })}
            />
            {errors.confirm && <span className="np-error">{errors.confirm.message}</span>}
          </div>

          <div className="np-actions">
            <button
              type="submit"
              className="login-button"
              disabled={loading || isSubmitting}
              style={{ flex: 1 }}
            >
              {loading || isSubmitting ? "Guardando..." : <b>Guardar</b>}
            </button>
            {/* Sin botón cancelar -> bloqueante */}
          </div>

          <p className="np-hint">
            Reglas: mínimo 8 caracteres, incluir mayúscula, minúscula y número. Se permiten símbolos, pero no espacios.
          </p>
        </form>
      </div>
    </div>
  );
}
