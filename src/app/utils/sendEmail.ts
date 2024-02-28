import nodemailer from 'nodemailer';
import config from '../config';

/* ei nodemailer er setup local e khub shundor kaj kore, kntu vercel evabe mail sending support kore na ar, tai amar backend thikthak kaj korleo, shopkeeper er mail e mail jabe na. tao ei setup ta rakhlam karon kono paid hosting hole tkhn ei setup e aramche kaj korbe in sha allah */

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com.',
    port: 587,
    secure: config.NODE_ENV === 'production',
    auth: {
      user: 'fsd.whatislamsays@gmail.com',
      pass: config.email_app_password,
    },
  });

  await transporter.sendMail({
    from: 'fsd.whatislamsays@gmail.com', // sender address
    to, // to whom email is to be sent
    subject: 'GizmoBuy : Reset your password within 5 mins!', // Subject line
    html, // html body
  });
};
