function parseCCCD(text) {
  text = text.replace(/\n+/g, " ");

  return {
    hoTen: extract(text, /Họ tên[:\s]*(.*?)(?=Ngày sinh|Giới tính)/i),
    soCCCD: extract(text, /\b\d{12}\b/),
    ngaySinh: extract(text, /Ngày sinh[:\s]*(\d{2}\/\d{2}\/\d{4})/),
    gioiTinh: extract(text, /(Nam|Nữ)/),
    diaChi: extract(text, /Nơi thường trú[:\s]*(.*?)(?=Có giá trị|Ngày cấp)/i),
    ngayCap: extract(text, /Ngày cấp[:\s]*(\d{2}\/\d{2}\/\d{4})/)
  };
}

function extract(text, regex) {
  const match = text.match(regex);
  return match ? match[1] || match[0] : "";
}

module.exports = { parseCCCD };
