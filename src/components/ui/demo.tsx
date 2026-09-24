import { IDCardLanyard } from "@/components/ui/id-card-lanyard";
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Image } from "@/components/ui/image";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";

export function HeroSectionDemo() {
  return (
    <HeroSection
      badge={{
        text: "Introducing our new components",
        action: {
          text: "Learn more",
          href: "/docs",
        },
      }}
      title="Build faster with beautiful components"
      description="Premium UI components built with React and Tailwind CSS. Save time and ship your next project faster with our ready-to-use components."
      actions={[
        {
          text: "Get Started",
          href: "/docs/getting-started",
          variant: "default",
        },
        {
          text: "GitHub",
          href: "https://github.com/your-repo",
          variant: "glow",
          icon: <Icons.gitHub className="h-5 w-5" />,
        },
      ]}
      image={{
        light: "https://cdn.21st.dev/assets/mirror/86/867a175524a0966eb144327b962159fa1ac4e1822b0cd857759b754306f3b0d4.png",
        dark: "https://cdn.21st.dev/assets/mirror/cf/cfc7a54d3246bd8216b45d7d01273476ee5ca661554db59d8ae3c46e74d85bc9.png",
        alt: "UI Components Preview",
      }}
    />
  );
}

export function DemoOne() {
  return (
    <IDCardLanyard
      avatarUrl="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80"
      githubUrl="https://github.com/mayachen"
      linkedinUrl="https://linkedin.com/in/mayachen"
      instagramUrl="https://instagram.com/mayachen"
    />
  );
}

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Unleash the power of <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Scroll Animations
              </span>
            </h1>
          </>
        }
      >
        <Image
          src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=85"
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}

export function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
          Background lights are cool you know.
        </div>
        <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
          And this, is chemical burn.
        </div>
        <button className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
          Debug now
        </button>
      </motion.div>
    </AuroraBackground>
  );
}

export default DemoOne;


