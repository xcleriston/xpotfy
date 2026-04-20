import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../db.js';

const router = Router();

// Login route
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login request received:', { body: req.body });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    console.log('Looking for user:', username);
    
    // Find user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    console.log('Generating JWT...');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    console.log('JWT generated');

    // Get user credits
    console.log('Fetching user credits...');
    const credits = await db.get('SELECT balance FROM credits WHERE user_id = ?', [user.id]);
    console.log('Credits:', credits);

    const response = {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        balance: credits ? credits.balance : 0
      }
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rota de registro
router.post('/register', [
  body('username')
    .trim()
    .notEmpty().withMessage('Nome de usuário é obrigatório')
    .isLength({ min: 3 }).withMessage('O nome de usuário deve ter pelo menos 3 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('O nome de usuário só pode conter letras, números e sublinhados'),
  body('email')
    .isEmail().withMessage('Por favor, insira um e-mail válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    .matches(/[0-9]/).withMessage('A senha deve conter pelo menos um número')
    .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula')
], async (req, res) => {
  try {
    console.log('Registro recebido:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erros de validação:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Erro de validação',
        errors: errors.array() 
      });
    }

    const { username, email, password } = req.body;

    // Verifica se o nome de usuário já existe
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    if (existingUser) {
      console.log('Nome de usuário já existe:', username);
      return res.status(400).json({
        success: false,
        message: 'Este nome de usuário já está em uso. Por favor, escolha outro.'
      });
    }

    // Verifica se o e-mail já está cadastrado
    const existingEmail = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail) {
      console.log('E-mail já cadastrado:', email);
      return res.status(400).json({
        success: false,
        message: 'Este e-mail já está cadastrado. Por favor, use outro e-mail ou faça login.'
      });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Senha criptografada com sucesso');

    // Inicia uma transação
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Cria o usuário
      const result = await db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user']
      );
      
      // Inicializa o saldo do usuário
      await db.run(
        'INSERT INTO credits (user_id, balance) VALUES (?, ?)',
        [result.lastID, 100] // Saldo inicial de 100 créditos
      );
      
      // Confirma a transação
      await db.run('COMMIT');
      
      console.log('Usuário registrado com sucesso:', username);
      
      res.status(201).json({ 
        success: true,
        message: 'Conta criada com sucesso! Redirecionando para o login...',
        userId: result.lastID
      });
    } catch (error) {
      // Em caso de erro, faz rollback da transação
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente mais tarde.'
    });
  }
});

export default router;
