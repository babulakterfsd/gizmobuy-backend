/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unsafe-optional-chaining */
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/AppError';

import { sendEmail } from '../../utils/sendEmail';
import {
  TChangePasswordData,
  TDecodedUser,
  TLastPassword,
  TUser,
  TUserProfileDataToBeUpdated,
} from './auth.interface';
import { UserModel } from './auth.model';

//create user in DB
const registerUserInDB = async (user: TUser) => {
  const isUserExistsWithEmail = await UserModel.isUserExistsWithEmail(
    user?.email,
  );

  if (isUserExistsWithEmail) {
    throw new Error(
      'User with this email already exists, please try with different  email.',
    );
  } else {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // transaction - 1
      const newUser = await UserModel.create([user], {
        session,
      });

      await session.commitTransaction();
      await session.endSession();

      if (newUser.length < 1) {
        throw new Error('Registration failed !');
      }

      return newUser[0];
    } catch (err: any) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error(err);
    }
  }
};

// login suser in DB
const loginUserInDB = async (user: TUser) => {
  const userFromDB = await UserModel.isUserExistsWithEmail(user?.email);
  if (!userFromDB) {
    throw new Error('No user found with this email');
  }
  const isPasswordMatched = await bcrypt.compare(
    user?.password,
    userFromDB.password,
  );
  if (!isPasswordMatched) {
    throw new Error('Incorrect password');
  }

  //create token and send it to client side
  const payload = {
    _id: userFromDB?._id,
    name: userFromDB?.name,
    email: userFromDB?.email,
    role: userFromDB?.role,
    isBlocked: userFromDB?.isBlocked,
  };

  const accesstoken = jwt.sign(payload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in,
  });

  const refreshfToken = jwt.sign(payload, config.jwt_refresh_secret as string, {
    expiresIn: config.jwt_refresh_expires_in,
  });

  return {
    accesstoken,
    refreshfToken,
    userFromDB,
  };
};

//verify token from client side
const verifyToken = async (token: string) => {
  if (!token) {
    return false;
  }

  // checking token is valid or not
  let decodedUser: JwtPayload | string;

  try {
    decodedUser = jwt.verify(
      token as string,
      config.jwt_access_secret as string,
    ) as JwtPayload;
  } catch (error) {
    return false;
  }

  const { email } = decodedUser as JwtPayload;

  // checking if the user exists
  const user = await UserModel.isUserExistsWithEmail(email);

  if (!user) {
    return false;
  }

  return true;
};

//generate refresh token
const getAccessTokenByRefreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  // checking token is valid or not
  let decodedUser: JwtPayload | string;

  try {
    decodedUser = jwt.verify(
      token as string,
      config.jwt_refresh_secret as string,
    ) as JwtPayload;
  } catch (error) {
    throw new JsonWebTokenError('Unauthorized Access!');
  }

  const { _id, name, role, email, isBlocked } = decodedUser as JwtPayload;

  // checking if the user exists
  const user = await UserModel.isUserExistsWithEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'Unauthorized Access!');
  }

  const payload = {
    _id,
    name,
    role,
    email,
    isBlocked,
  };

  const accessToken = jwt.sign(payload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in,
  });

  return {
    accessToken,
  };
};

// change password
const changePasswordInDB = async (
  passwordData: TChangePasswordData,
  user: TDecodedUser,
) => {
  const { currentPassword, newPassword } = passwordData;

  // check if the user exists in the database
  const userFromDB = await UserModel.findOne({
    email: user?.email,
  });
  if (!userFromDB) {
    throw new JsonWebTokenError('Unauthorized Access!');
  }

  if (
    userFromDB?.email === 'babulakterfsd@gmail.com' ||
    userFromDB?.email === 'xpawal@gmail.com' ||
    userFromDB?.email === 'awal.hostmail@gmail.com'
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Password change is not allowed for this demo account',
    );
  }

  const currentAccesstokenIssuedAt = user?.iat * 1000;

  let lastPasswordChangedAt: Date | number = userFromDB?.lastTwoPasswords?.[1]
    ?.changedAt
    ? (userFromDB?.lastTwoPasswords?.[1]?.changedAt as Date)
    : (userFromDB?.lastTwoPasswords?.[0]?.changedAt as Date);

  //convert lastPasswordChangedAt to miliseconds
  lastPasswordChangedAt = new Date(lastPasswordChangedAt as Date).getTime();

  if (userFromDB?.lastTwoPasswords?.length === 0) {
    lastPasswordChangedAt = (userFromDB?.createdAt as Date).getTime();
  }

  if (currentAccesstokenIssuedAt < lastPasswordChangedAt) {
    // throw new JsonWebTokenError('Unauthorized Access!');
    return {
      statusCode: 406,
      status: 'failed',
      message: 'Recent password change detected.',
    };
  }

  // check if the current password the user gave is correct
  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    userFromDB.password,
  );
  if (!isPasswordMatched) {
    throw new Error('Current password does not match');
  }

  // Check if new password is the same as the current one
  const isSameAsCurrent = currentPassword === newPassword;
  if (isSameAsCurrent) {
    throw new Error('New password must be different from the current password');
  }

  // Check if the new password is the same as the last two passwords
  const isSameAsLastTwoPasswords = userFromDB?.lastTwoPasswords?.some(
    (password: TLastPassword) => {
      return bcrypt.compareSync(newPassword, password.oldPassword);
    },
  );

  if (isSameAsLastTwoPasswords) {
    const lastUsedDate = userFromDB?.lastTwoPasswords?.[0]?.changedAt;
    const formattedLastUsedDate = lastUsedDate
      ? new Date(lastUsedDate).toLocaleString()
      : 'unknown';

    throw new Error(
      `Password change failed. Ensure the new password is unique and not among the last 2 used (last used on ${formattedLastUsedDate}).`,
    );
  }

  // Check if the new password meets the minimum requirements

  if (newPassword.length < 6 || !/\d/.test(newPassword)) {
    throw new Error(
      'New password must be minimum 6 characters and include both letters and numbers',
    );
  }

  // Update the password and keep track of the last two passwords
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  const newLastTwoPasswords = () => {
    if (userFromDB?.lastTwoPasswords?.length === 0) {
      return [{ oldPassword: userFromDB?.password, changedAt: new Date() }];
    } else if (userFromDB?.lastTwoPasswords?.length === 1) {
      return [
        ...userFromDB?.lastTwoPasswords,
        { oldPassword: userFromDB?.password, changedAt: new Date() },
      ];
    } else if (userFromDB?.lastTwoPasswords?.length === 2) {
      return [
        userFromDB?.lastTwoPasswords[1],
        { oldPassword: userFromDB?.password, changedAt: new Date() },
      ];
    }
  };

  const result = await UserModel.findOneAndUpdate(
    { email: userFromDB?.email },
    {
      password: hashedNewPassword,
      lastTwoPasswords: newLastTwoPasswords(),
    },
    {
      new: true,
    },
  );

  if (!result) {
    throw new Error('Password change failed');
  }

  const modifiedResult = {
    _id: result?._id,
    name: result?.name,
    email: result?.email,
    role: result?.role,
  };

  return modifiedResult;
};

//forgot password
const forgetPasswordInDB = async (userEmail: string) => {
  if (!userEmail) {
    throw new Error('Invalid email');
  }
  const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(userEmail)) {
    throw new Error('Invalid email format');
  }

  if (
    userEmail === 'babulakterfsd@gmail.com' ||
    userEmail === 'xpawal@gmail.com' ||
    userEmail === 'awal.hostmail@gmail.com'
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Password reset is not allowed for this demo account',
    );
  }

  const userFromDB = await UserModel.findOne({
    email: userEmail,
  });
  if (!userFromDB) {
    throw new Error('No account found with that email');
  }

  const payload = {
    email: userFromDB?.email,
  };
  const resettoken = jwt.sign(payload, config.jwt_access_secret as string, {
    expiresIn: '5m',
  });

  const resetUrl = `${config.client_url}/forgot-password?email=${userEmail}&token=${resettoken}`;

  sendEmail(
    userFromDB?.email,
    `<p>Click <a href="${resetUrl}" target="_blank">here</a> to reset your password</p> . <br/> <p>If you didn't request a password reset, please ignore this email.After 5 mins, the link will be invalid</p>`,
  );

  return null;
};

// reset forgotten password
const resetForgottenPasswordInDB = async (
  userEmail: string,
  resetToken: string,
  newPassword: string,
) => {
  if (!userEmail || !resetToken || !newPassword) {
    throw new Error('Invalid data');
  } else if (newPassword.length < 6 || !/\d/.test(newPassword)) {
    throw new Error(
      'New password must be minimum 6 characters and include both letters and numbers',
    );
  } else if (
    userEmail === 'babulakterfsd@gmail.com' ||
    userEmail === 'xpawal@gmail.com' ||
    userEmail === 'awal.hostmail@gmail.com'
  ) {
    throw new Error('Password reset is not allowed for this demo account');
  }

  const userFromDB = await UserModel.findOne({
    email: userEmail,
  });
  if (!userFromDB) {
    throw new Error('No account found with that email');
  } else {
    // checking token is valid or not
    let decodedUser: JwtPayload | string;

    try {
      decodedUser = jwt.verify(
        resetToken as string,
        config.jwt_access_secret as string,
      ) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }

    if (decodedUser.email !== userEmail) {
      throw new Error('Invalid token');
    }

    const userFromDB = await UserModel.findOne({
      email: userEmail,
    });
    if (!userFromDB) {
      throw new Error(
        'No account found with that email while resetting password',
      );
    }

    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      Number(config.bcrypt_salt_rounds),
    );

    const result = await UserModel.findOneAndUpdate(
      { email: userFromDB?.email },
      {
        password: hashedNewPassword,
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new Error('Password reset failed');
    }

    const modifiedResult = {
      _id: result?._id,
      name: result?.name,
      email: result?.email,
      role: result?.role,
    };

    return modifiedResult;
  }
};

//update user profile
const updateUserProfileInDB = async (
  user: TDecodedUser,
  dataToBeUpdated: TUserProfileDataToBeUpdated,
) => {
  const userFromDB = await UserModel.findOne({
    email: user?.email,
  });

  if (!userFromDB) {
    throw new JsonWebTokenError('Unauthorized Access!');
  }

  const { name, profileImage, isBlocked } = dataToBeUpdated;

  const result = await UserModel.findOneAndUpdate(
    { email: userFromDB?.email },
    {
      name: name ? name : userFromDB?.name,
      profileImage: profileImage ? profileImage : userFromDB?.profileImage,
      isBlocked: isBlocked ? isBlocked : userFromDB?.isBlocked,
    },
    {
      new: true,
    },
  );

  if (!result) {
    throw new Error('Update failed');
  }

  const modifiedResult = {
    _id: result?._id,
    name: result?.name,
    email: result?.email,
    role: result?.role,
    profileImage: result?.profileImage,
    isBlocked: result?.isBlocked,
  };

  return modifiedResult;
};

// get user by email
const getuserFromDBByEmail = async (email: string) => {
  if (!email) {
    throw new Error('Email is required');
  } else {
    const userFromDB = await UserModel.findOne({
      email,
    });
    const modifiedUser = {
      _id: userFromDB?._id,
      name: userFromDB?.name,
      email: userFromDB?.email,
      role: userFromDB?.role,
      profileImage: userFromDB?.profileImage,
      isEmailVerified: userFromDB?.isEmailVerified,
      isBlocked: userFromDB?.isBlocked,
    };

    return modifiedUser;
  }
};

export const UserServices = {
  registerUserInDB,
  loginUserInDB,
  verifyToken,
  getAccessTokenByRefreshToken,
  changePasswordInDB,
  forgetPasswordInDB,
  resetForgottenPasswordInDB,
  updateUserProfileInDB,
  getuserFromDBByEmail,
};
