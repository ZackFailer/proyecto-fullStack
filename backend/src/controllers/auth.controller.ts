import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { error } from 'node:console';


const fakeUser = {
  id: 1,
  email: 'ejemplo@gmail.com',
  // La contraseña debe estar hasheada. Supongamos que "123456" hasheada es:
  password: bcrypt.hashSync("123456", 10) // (debes generarlo con bcrypt.hashSync("123456", 10))
};

const authController = {
    login: async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                res.status(400).json({ message: 'Email and password are required' });
                return;
            }
    
            if (email !== fakeUser.email) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }
    
            const isPasswordValid = await bcrypt.compare(password, fakeUser.password);
            if (!isPasswordValid) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }
    
            const payload = { id: fakeUser.id, email: fakeUser.email };
    
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '1h' });
    
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' || false,
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000 // 1 hour
            });

            res.json({message: 'Login successful', user: payload})
        } catch (err) {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        }
    }
}

export default authController;
