const Expediente = require("./Expediente");
const Indicio = require("./Indicio");



Expediente.hasMany(Indicio, { foreignKey: "expedienteId" });
Indicio.belongsTo(Expediente, { foreignKey: "expedienteId" });

module.exports = { Expediente, Indicio };
