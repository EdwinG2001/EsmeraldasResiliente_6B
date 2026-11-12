import apiClient from './client';

export const humanitarianApi = {
  getCensoFamilias: async () => {
    const res = await apiClient.get('/humanitaria/censo-familias/?formato=simple');
    const data = res.data;
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data?.results)) {
      list = data.results;
    } else if (data?.results?.features && Array.isArray(data.results.features)) {
      list = data.results.features.map((f) => ({
        id: f.id || f.properties?.id,
        latitud: f.geometry?.coordinates?.[1],
        longitud: f.geometry?.coordinates?.[0],
        ...(f.properties || {})
      }));
    } else if (data?.features && Array.isArray(data.features)) {
      list = data.features.map((f) => ({
        id: f.id || f.properties?.id,
        latitud: f.geometry?.coordinates?.[1],
        longitud: f.geometry?.coordinates?.[0],
        ...(f.properties || {})
      }));
    }
    return list;
  },
  crearCensoFamilia: async (familiaData) => {
    const res = await apiClient.post('/humanitaria/censo-familias/?formato=simple', familiaData);
    return res.data;
  },
  
  // Bodegas de Acopio CRUD
  getBodegas: async () => {
    const res = await apiClient.get('/humanitaria/bodegas/');
    return res.data?.results || res.data;
  },
  crearBodega: async (bodegaData) => {
    const res = await apiClient.post('/humanitaria/bodegas/', bodegaData);
    return res.data;
  },
  actualizarBodega: async (id, bodegaData) => {
    const res = await apiClient.patch(`/humanitaria/bodegas/${id}/`, bodegaData);
    return res.data;
  },
  eliminarBodega: async (id) => {
    const res = await apiClient.delete(`/humanitaria/bodegas/${id}/`);
    return res.data;
  },

  // Suministros y Kits CRUD
  getSuministros: async () => {
    const res = await apiClient.get('/humanitaria/suministros/');
    return res.data?.results || res.data;
  },
  crearSuministro: async (suministroData) => {
    const res = await apiClient.post('/humanitaria/suministros/', suministroData);
    return res.data;
  },
  actualizarSuministro: async (id, suministroData) => {
    const res = await apiClient.patch(`/humanitaria/suministros/${id}/`, suministroData);
    return res.data;
  },
  eliminarSuministro: async (id) => {
    const res = await apiClient.delete(`/humanitaria/suministros/${id}/`);
    return res.data;
  },

  getInventario: async () => {
    const res = await apiClient.get('/humanitaria/inventario/');
    return res.data?.results || res.data;
  },

  // Solicitudes de Censo de Familias (Ventana de 48h)
  getSolicitudesCenso: async (params = {}) => {
    const res = await apiClient.get('/humanitaria/solicitudes-censo/', { params });
    return res.data?.results || res.data;
  },
  crearSolicitudCenso: async (data) => {
    const res = await apiClient.post('/humanitaria/solicitudes-censo/', data);
    return res.data;
  },
  actualizarSolicitudCenso: async (id, data) => {
    const res = await apiClient.patch(`/humanitaria/solicitudes-censo/${id}/`, data);
    return res.data;
  },
  eliminarSolicitudCenso: async (id) => {
    const res = await apiClient.delete(`/humanitaria/solicitudes-censo/${id}/`);
    return res.data;
  },
};
