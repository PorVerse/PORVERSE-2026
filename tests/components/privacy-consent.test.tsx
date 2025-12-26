import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrivacyConsent } from '@/components/biometric/privacy-consent'

describe('PrivacyConsent', () => {
  const mockOnAccept = vi.fn()
  const mockOnDecline = vi.fn()

  it('renders consent modal', () => {
    render(
      <PrivacyConsent
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userId="test-user"
      />
    )

    expect(screen.getByText(/privacy/i)).toBeInTheDocument()
  })

  it('has biometricCapture checked by default', () => {
    render(
      <PrivacyConsent
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userId="test-user"
      />
    )

    const checkbox = screen.getByRole('checkbox', { name: /biometric/i })
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()
  })

  it('calls onDecline when declined', () => {
    render(
      <PrivacyConsent
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userId="test-user"
      />
    )

    const declineButton = screen.getByRole('button', { name: /decline/i })
    fireEvent.click(declineButton)

    expect(mockOnDecline).toHaveBeenCalled()
  })

  it('calls onAccept when accepted', async () => {
    render(
      <PrivacyConsent
        isOpen={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userId="test-user"
      />
    )

    const acceptButton = screen.getByRole('button', { name: /accept/i })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalled()
    })
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PrivacyConsent
        isOpen={false}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        userId="test-user"
      />
    )

    expect(container.firstChild).toBeNull()
  })
})