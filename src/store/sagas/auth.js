import {delay, put, call} from 'redux-saga/effects'
import axios from 'axios'

import * as actions from '../actions'

export function* logoutSaga(action) {
    yield call([localStorage, 'removeItem'], "token");
    yield call([localStorage, 'removeItem'], "expirationDate");
    yield call([localStorage, 'removeItem'], "userId");
    yield put(actions.logoutSucceed());
}

export function* checkAuthTimeoutSaga(action) {
    yield delay(action.expirationTime);
    yield put(actions.logout());
}

export function* authUserSaga(action) {
    yield put(actions.authStart());
    const authData = {
        email: action.email,
        password: action.password,
        returnSecureToken: true
    };
    let url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAg3lB28AHr-uMEIA5k2AGJVEGwSJxCqRw';
    if (!action.isSignup) {
        url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAg3lB28AHr-uMEIA5k2AGJVEGwSJxCqRw';
    }
    const response = yield axios.post(url, authData);
    try {
        const expirationDate = new Date(new Date().getTime() + response.data.expiresIn * 1000);
        localStorage.setItem('token', response.data.idToken);
        localStorage.setItem('expirationDate', expirationDate);
        localStorage.setItem('userId', response.data.localId);
        yield put(actions.authSuccess(response.data.idToken, response.data.localId));
        yield put(actions.checkAuthTimeout(response.data.expiresIn));        
    }
    catch(error) {
        yield put(actions.authFail(error.response.data.error));
    }
}

export function* authCheckStateSaga(action){
    const token = yield localStorage.getItem('token');
    if (!token) {
        yield put(actions.logout());
    } else {
        const expirationDate = yield new Date(localStorage.getItem('expirationDate'));
        if (expirationDate <= new Date()) {
            yield put(actions.logout());
        } else {
            const userId = yield localStorage.getItem('userId');
            yield put(actions.authSuccess(token, userId));
            yield put(actions.checkAuthTimeout((expirationDate.getTime() - new Date().getTime()) / 1000 ));
        }   
    }    
}