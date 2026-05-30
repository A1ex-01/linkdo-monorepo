import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { authService } from '@/services/auth'
import { Loader2, LogIn, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const codeSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
})

type EmailFormData = z.infer<typeof emailSchema>
type CodeFormData = z.infer<typeof codeSchema>

interface UserAuthFormProps {
  className?: string
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo }: UserAuthFormProps) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
  })

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: 'onBlur',
  })

  async function handleSendCode(data: EmailFormData) {
    setIsSending(true)
    setEmail(data.email)
    try {
      const res = await authService.sendCode(data.email)
      if (res.success) {
        toast.success('Verification code sent! Check your email.')
        setStep('code')
      }
    } catch {
      toast.error('Failed to send code. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleVerify(data: CodeFormData) {
    console.log('🐽🐽 ~ user-auth-form.tsx ~ handleVerify ~ data:', data)
    setIsLoading(true)
    try {
      const res = await authService.verifyCode(data.email, data.code)
      if (res.success && res.data) {
        // Save token first, then fetch user — interceptor reads from localStorage
        auth.setAccessToken(res.data.token)
        await new Promise((resolve) => setTimeout(resolve, 50))
        const meRes = await authService.getMe()
        if (meRes.success && meRes.data) {
          auth.setUser(meRes.data)
        }
        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })
        toast.success(`Welcome, ${data.email}!`)
      }
    } catch {
      toast.error('Invalid code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'code') {
    return (
      <Form {...codeForm}>
        <form
          onSubmit={codeForm.handleSubmit(handleVerify)}
          className={className}
        >
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Mail size={14} />
            <span>Code sent to {email}</span>
          </div>

          <FormField
            control={codeForm.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter 6-digit code'
                    maxLength={6}
                    className='text-center font-mono text-lg tracking-[0.5em]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            disabled={isLoading}
            onClick={() => {
              handleVerify({
                ...codeForm.getValues(),
                ...emailForm.getValues(),
              })
            }}
          >
            {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
            Verify & Sign In
          </Button>

          <Button
            type='button'
            variant='ghost'
            className='text-muted-foreground'
            onClick={() => setStep('email')}
          >
            Use a different email
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...emailForm}>
      <form
        onSubmit={emailForm.handleSubmit(handleSendCode)}
        className={className}
      >
        <FormField
          control={emailForm.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isSending}>
          {isSending ? (
            <Loader2 className='animate-spin' />
          ) : (
            <Mail className='size-4' />
          )}
          {isSending ? 'Sending...' : 'Send Verification Code'}
        </Button>
      </form>
    </Form>
  )
}
