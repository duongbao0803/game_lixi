import { useMemo } from 'react';
import './FallingPetals.css';

export function FallingPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className={`petal ${Math.random() > 0.5 ? 'type-1' : 'type-2'}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      )),
    [],
  );

  return <div className='falling-petals'>{petals}</div>;
}
