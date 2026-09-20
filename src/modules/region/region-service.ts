import RegionModel from "./region-model";

const findByCity = async (name: string = "") => {
  const sanitizedKeyword = name.trim();

  if (!sanitizedKeyword) {
    return [];
  }

  const result = await RegionModel.findByCity(sanitizedKeyword);

  return result ?? [];
};

const getAllProvinces = async () => {
  const result = await RegionModel.getAllProvinces();
  return result;
};

const getProvince = async (id: number) => {
  const result = await RegionModel.getProvince(id);
  return result;
};

const getRegency = async (id: number) => {
  const result = await RegionModel.getRegency(id);
  return result;
};

const getDistrict = async (id: number) => {
  const result = await RegionModel.getDistrict(id);
  return result;
};

const getVillage = async (id: number) => {
  const result = await RegionModel.getVillage(id);
  return result;
};

export default {
  findByCity,
  getAllProvinces,
  getProvince,
  getRegency,
  getDistrict,
  getVillage,
};
