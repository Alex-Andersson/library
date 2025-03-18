"use client";

import Authform from '@/components/Authform'
import { signUp } from '@/lib/actions/auth'
import { signUpSchema } from '@/lib/validations'
import React from 'react'

const page = () => {
  return (
    <Authform
       type='SIGN_UP'
       schema={signUpSchema}
       defaultValues={{
        email: '', 
        password: '',
        fullName: '',
        universityId: 0,
        }}
       onSubmit={signUp}
    />
  )
}

export default page