import axios from 'axios';
import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 for localhost
// iOS Simulator uses localhost
// Physical Devices need your computer's LAN IP
// REPLACE THIS WITH YOUR COMPUTER'S LAN IP
// Run 'ifconfig' (Mac) or 'ipconfig' (Windows) to find it.
const BASE_URL = 'http://10.0.0.161:8000/api/v1';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default client;
