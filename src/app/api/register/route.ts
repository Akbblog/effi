
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password, company, contactNumber } = await req.json();

        if (!name || !email || !password || !contactNumber) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const userExists = await User.findOne({ email });

        if (userExists) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            contactNumber,
            password: hashedPassword,
            company,
            status: 'pending' // Explicitly set to pending
        });

        return NextResponse.json({ message: 'Registration submitted.' }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: 'Error registering user', error }, { status: 500 });
    }
}
