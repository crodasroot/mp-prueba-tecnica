import { expect } from 'chai';
import request from 'supertest';
import bcrypt from 'bcryptjs';

import app from '../app.js';
import Usuario from '../models/User.js';
import Expediente from '../models/expediente.js';

describe('Auth & Expedientes integration (stubbed)', () => {
  let originalObtenerPorEmail;
  let originalObtenerTodos;

  before(() => {
    // backup originals
    originalObtenerPorEmail = Usuario.obtenerPorEmail;
    originalObtenerTodos = Expediente.obtenerTodos;
  });

  after(() => {
    // restore originals
    Usuario.obtenerPorEmail = originalObtenerPorEmail;
    Expediente.obtenerTodos = originalObtenerTodos;
  });

  it('login should return a token and allow accessing expedientes', async () => {
    const plainPassword = 'secret123';
    const hashed = await bcrypt.hash(plainPassword, 10);

    // stub obtenerPorEmail to return a fake user
    Usuario.obtenerPorEmail = async (email) => ({
      id: 42,
      nombre: 'Test User',
      email,
      rol: 'tecnico',
      password: hashed
    });

    // stub expedientes to return sample data
    Expediente.obtenerTodos = async (filtros) => ([
      { id: 1, numero_expediente: 'EXP-001', titulo: 'Demo' }
    ]);

    // 1) login
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: plainPassword })
      .expect(200);

    expect(loginRes.body).to.have.property('token');
    const token = loginRes.body.token;

    // 2) access protected route /api/expedientes
    const expedientesRes = await request(app)
      .get('/api/expedientes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(expedientesRes.body).to.be.an('array');
    expect(expedientesRes.body[0]).to.have.property('numero_expediente');
  });
});
