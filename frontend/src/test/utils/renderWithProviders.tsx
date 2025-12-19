import { render } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { LocationProvider } from '../../contexts/LocationContext'
import { AuthProvider } from '../../contexts/AuthContext'

const AllTheProviders = ({ children }: { children: ReactNode }) => {
    return (
        <MemoryRouter>
            <AuthProvider>
                <ThemeProvider>
                    <LocationProvider>
                        {children}
                    </LocationProvider>
                </ThemeProvider>
            </AuthProvider>
        </MemoryRouter>
    )
}

const renderWithProviders = (ui: ReactElement, options?: any) =>
    render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { renderWithProviders }
