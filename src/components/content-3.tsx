import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ChevronRight } from 'lucide-react'


export default function ContentSection() {
    return (
        <section className="py-10 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
                <img
                    className="rounded-(--radius)  transition-100"
                    src="./banner.jpg"
                    alt="team image"
                    height=""
                    width=""
                    loading="lazy"
                />

                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                   <h2 className="text-3xl font-medium">
                     <span className="font-bold">LifeTag</span> --- a smarter way to manage and track your cattle digitally.
                    </h2>

                    <div className="space-y-6">
                        <p>LifeTag goes beyond traditional livestock management. It integrates cloud-based APIs, and real-time analytics to provide a complete digital ecosystem for cattle monitoring and farm automation.LifeTag also eliminates the challenges of manual cattle record-keeping by offering an INAPH-integrated platform that ensures accuracy, transparency, and real-time accessibility for farmers and veterinary officials.</p>

                        {/* <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="gap-1 pr-1.5">
                            <Link to="#">
                                <span>Learn More</span>
                                <ChevronRight className="size-2" />
                            </Link>
                        </Button> */}
                    </div>
                </div>
            </div>
        </section>
    )
}
