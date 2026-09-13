import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import './firebase';

export const auth = getAuth(getApp());