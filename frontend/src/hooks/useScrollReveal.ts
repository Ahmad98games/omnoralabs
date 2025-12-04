import { useEffect, useRef } from 'react'

export function useScrollReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.classList.add('is-visible')
                    observer.unobserve(element) // Only animate once
                }
            },
            {
                threshold,
                rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
            }
        )

        // Add base class if not present
        element.classList.add('reveal-on-scroll')

        observer.observe(element)

        return () => {
            if (element) observer.unobserve(element)
        }
    }, [threshold])

    return ref
}
