import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import React from 'react'
import { motion, useScroll } from 'framer-motion'
import { cn } from '../lib/utils'

const menuItems = [
    { name: 'Home', to: '/' },
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Register Complaint', to: '/Contact' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { scrollYProgress } = useScroll()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    // Animation variants
    const navVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };
    const menuStagger = {
        visible: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };
    const menuItem = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
    };

    return (
        <header className="relative">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 -z-10 h-32 w-full bg-gradient-to-r from-primary/40 via-accent/30 to-primary/10 blur-2xl"
            />
            <motion.nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full pt-2"
                variants={navVariants}
                initial="hidden"
                animate="visible"
            >
                <div className={cn('mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12', scrolled && 'bg-background/50 backdrop-blur-2xl')}>
                    <motion.div
                        key={1}
                        className={cn('relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6', scrolled && 'lg:py-4')}
                    >
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                to="/"
                                aria-label="home"
                                className="flex items-center text-xl space-x-2"
                                
                                onClick={()=>{
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                                }}
                                >
                                LifeTag
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <motion.ul
                                    className="flex gap-8 text-sm"
                                    variants={menuStagger}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {menuItems.map((item, index) => (
                                        <motion.li key={index} variants={menuItem}>
                                            <Link
                                                to={item.to}
                                                className="relative group text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span className="transition-colors duration-200 group-hover:text-primary">
                                                    {item.name}
                                                </span>
                                                <span
                                                    className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"
                                                />
                                            </Link>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </div>
                        </div>

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <motion.ul
                                    className="space-y-6 text-base"
                                    variants={menuStagger}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {menuItems.map((item, index) => (
                                        <motion.li key={index} variants={menuItem}>
                                            <Link
                                                to={item.to}
                                                className="relative group text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span className="transition-colors duration-200 group-hover:text-primary">
                                                    {item.name}
                                                </span>
                                                <span
                                                    className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"
                                                />
                                            </Link>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm">
                                    <Link to="/dialog">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm">
                                    <Link to="/dialog">
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.nav>
        </header>
    )
}
