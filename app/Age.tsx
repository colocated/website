"use client";

import { useEffect, useState } from "react";

const BIRTH = Date.UTC(2005, 7, 25);

function calcAge(now: Date) {
  const birth = new Date(BIRTH);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export default function Age({ initial }: { initial: number }) {
  const [age, setAge] = useState(initial);
  useEffect(() => {
    setAge(calcAge(new Date()));
  }, []);
  return <>{age}</>;
}
