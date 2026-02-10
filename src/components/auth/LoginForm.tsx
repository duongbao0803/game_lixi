import React from 'react';
import './LoginForm.css';

interface LoginFormProps {
  localUser: { email: string; account: string };
  setLocalUser: React.Dispatch<React.SetStateAction<{ email: string; account: string }>>;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ localUser, setLocalUser, handleLogin, isLoading }: LoginFormProps) {
  return (
    <div className='auth-container tet-theme'>
      <h1>🌸 Hội Đua Ngựa Xuân 🌸</h1>
      <form
        onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        <div className='input-group'>
          <div className='suffix-wrapper'>
            <input
              type='text'
              className='input-with-suffix'
              placeholder='Nhập Email'
              value={localUser.email}
              onChange={e => {
                let val = e.target.value;
                if (val.endsWith('@pnj.com.vn')) {
                  val = val.replace('@pnj.com.vn', '');
                }
                setLocalUser({ ...localUser, email: val });
              }}
              required
              autoComplete='off'
            />
            <span className='email-suffix'>@pnj.com.vn</span>
          </div>
        </div>
        <div className='input-group'>
          <input
            type='tel'
            inputMode='numeric'
            pattern='[0-9]*'
            placeholder='Nhập STK Vietinbank (12 số)'
            value={localUser.account}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 12);
              setLocalUser({ ...localUser, account: val });
            }}
            required
            autoComplete='off'
          />
        </div>
        <button type='submit' className='start-btn' disabled={isLoading}>
          {isLoading ? 'Đang Khai Xuân...' : 'Khai Xuân Đắc Lộc'}
        </button>
      </form>
    </div>
  );
}
