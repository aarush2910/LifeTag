import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { HeroHeader } from './header'
import { ChevronRight } from 'lucide-react'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-x-hidden">
                <section>
                    <div className="py-24 md:pb-32 lg:pb-36 lg:pt-72">
                        <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                                <h1 className="mt-8 max-w-2xl text-balance text-5xl md:text-5xl lg:mt-16 xl:text-6xl">Digitally managing cattle identity and welfare</h1>
                                <p className="mt-8 max-w-2xl text-balance text-lg">A smart platform for a digital cattle identification and tracking integrated partially with INAPH and farmer data. </p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-full pl-5 pr-3 text-base">
                                        <Link to="/dialog">
                                            <span className="text-nowrap" > Get Started </span>
                                            <ChevronRight className="ml-1" />
                                        </Link>
                                    </Button>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="h-12 rounded-full px-5 text-base hover:bg-zinc-950/5 dark:hover:bg-white/5">
                                        <Link to="#link">
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="aspect-2/3 absolute inset-1 -z-10 overflow-hidden rounded-3xl border border-black/10 lg:aspect-video lg:rounded-[3rem] dark:border-white/5">
                         {/* <div className="absolute inset-0 bg-gradient-to-b from-orange-400/60 via-orange-300/40 to-transparent"></div> */}
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="size-full object-cover opacity-70 dark:opacity-35 dark:invert-0 dark:lg:opacity-75" //invert
                                src="/cow_video.mp4"
                            ></video>
                        </div>
                    </div>
                </section>
                
            </main>
        </>
    )
}
