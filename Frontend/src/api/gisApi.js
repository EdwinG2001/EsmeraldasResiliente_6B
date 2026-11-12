import apiClient from './client';

export const gisApi = {
  getZonasRiesgo: async (params = {}) => {
    const res = await apiClient.get('/gis/zonas-riesgo/', { params });
    return res.data?.results || res.data;
  },
  getAlertasActivas: async () => {
    const res = await apiClient.get('/gis/zonas-riesgo/alerta-sectorial/');
    return res.data?.results || res.data;
  },
  emitirAlertaSectorial: async (payload) => {
    const res = await apiClient.post('/gis/zonas-riesgo/alerta-sectorial/', payload);
    return res.data;
  },
  getRedHidricaVial: async () => {
    const res = await apiClient.get('/gis/red-hidrica-vial/');
    return res.data?.results || res.data;
  },
  getInfraestructuras: async () => {
    const res = await apiClient.get('/gis/infraestructuras/');
    if (res.data?.results?.features) return res.data.results;
    if (res.data?.features) return res.data;
    if (res.data?.results) return res.data.results;
    return res.data;
  },
  updateInfraestructura: async (id, data) => {
    const res = await apiClient.patch(`/gis/infraestructuras/${id}/`, data);
    return res.data;
  },
  createInfraestructura: async (data) => {
    const res = await apiClient.post('/gis/infraestructuras/', data);
    return res.data;
  },
  deleteInfraestructura: async (id) => {
    const res = await apiClient.delete(`/gis/infraestructuras/${id}/`);
    return res.data;
  },
};
