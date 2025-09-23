import api from "./axiosInstance";

export const uploadNoteFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return data;
};
