import api from "../services/api";

export const fetchStudents = (setStudents) => {
  api
    .get("/students")
    .then((response) => setStudents(response.data))
    .catch((error) => console.error("Error fetching students:", error));
};

export const fetchPayments = (setPayments) => {
  api
    .get("/payments")
    .then((response) => setPayments(response.data))
    .catch((error) => console.error("Error fetching payments:", error));
};

export const fetchPaymentsByStudent = async (setData,setLoading) => {
    try {
      const response = await api.get("/payments/grouped");
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener los pagos agrupados:", error);
    } finally {
      setLoading(false);
    }
  };