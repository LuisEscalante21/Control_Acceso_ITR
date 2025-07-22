import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import '../../styles/Admin/Accesos.css';
import icon from '../../img/salida_acceso.png';
import useAccessControl from '../../hooks/admin/useDataAccess';

const HorarioOptions = ['Entrada', 'Salida'];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState('Todos');
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const docentesRef = useRef(null);
  const salidasRef = useRef(null);

  const {
    accessRecords,
    fetchAccessRecords,
    fetchTeams,
    teams: docentesOptions
  } = useAccessControl();

 useEffect(() => {
  fetchAccessRecords();
}, []); 


  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === 'docentes' && docentesRef.current && !docentesRef.current.contains(event.target)) ||
        (openDropdown === 'salidas' && salidasRef.current && !salidasRef.current.contains(event.target))
      ) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSelectDocente = (option) => {
    setSelectedDocente(option);
    setOpenDropdown(null);
  };

  const handleSelectSalida = (option) => {
    setSelectedSalida(option);
    setOpenDropdown(null);
  };

  return (
    <div className="access-history-container">
      <div className="encabezado-accesos">
        <h1 className="titulo">Historial de accesos</h1>

        <div className="buscador">
          <Search className="search-icon" />
          <input type="text" placeholder="Buscar por nombre o apellido" />
        </div>

        <div className="filters">
          <div className="dropdown" ref={docentesRef}>
            <button className="filter-button docentes" onClick={() => handleDropdown('docentes')}>
              {selectedDocente} <ChevronDown size={16} />
            </button>
            {openDropdown === 'docentes' && (
              <div className="dropdown-menu docentes">
                {docentesOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectDocente(option)}
                    className={selectedDocente === option ? 'selected' : ''}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown" ref={salidasRef}>
            <button className="filter-button salidas" onClick={() => handleDropdown('salidas')}>
              {selectedSalida} <ChevronDown size={16} />
            </button>
            {openDropdown === 'salidas' && (
              <div className="dropdown-menu salidas">
                {HorarioOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectSalida(option)}
                    className={selectedSalida === option ? 'selected' : ''}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="access-list-container">
        <div className="access-list">
          {accessRecords.length === 0 ? (
            <p>No hay registros de acceso para mostrar.</p>
          ) : (
            accessRecords.map((person, index) => (
              <div className="access-card" key={index}>
                <div className="user-info">
                  <span className="status-dot" />
                  <img src={person.avatar} alt="Avatar" />
                  <p style={{ color: "#000000ab" }}>
                    Nombre: {person.name}
                  </p>
                </div>
                <div className="exit-info">
                  <img src={icon} alt="Ícono de salida" width={18} height={18} />
                  <span>{selectedSalida}: {person.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Accesos;
