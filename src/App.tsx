import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Braces,
  GraduationCap,
  Menu,
  PanelsTopLeft,
  X,
  type LucideProps,
} from 'lucide-react'
import { Reveal } from './components/Reveal'

const HeroScene = lazy(() => import('./components/HeroScene'))

const whatsappHref =
  'https://wa.me/5518996496255?text=Ol%C3%A1%2C%20Igor!%20Encontrei%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar%20sobre%20um%20projeto.'

type Service = {
  number: string
  title: string
  description: string
  icon: ComponentType<LucideProps>
}

const services: Service[] = [
  {
    number: '01',
    title: 'Produtos com IA',
    description: 'Agentes, automações, busca inteligente e experiências generativas conectadas ao negócio.',
    icon: BrainCircuit,
  },
  {
    number: '02',
    title: 'Front-end & experiências',
    description: 'Interfaces acessíveis e performáticas com React, Next.js, Vue, React Native e Three.js.',
    icon: PanelsTopLeft,
  },
  {
    number: '03',
    title: 'Back-end & integrações',
    description: 'APIs, arquiteturas e sistemas robustos com Node.js, PHP, bancos de dados e serviços em nuvem.',
    icon: Braces,
  },
  {
    number: '04',
    title: 'Consultoria & educação',
    description: 'Diagnóstico técnico, mentoria, treinamento corporativo e formação de novos desenvolvedores.',
    icon: GraduationCap,
  },
]

const experiences = [
  { period: '2016 — 2021', company: 'Agência Desigual', role: 'Full-stack Developer' },
  { period: '2021 — 2022', company: 'Vista Software', role: 'Full-stack Developer' },
  { period: '2022 — hoje', company: 'SENAI São Paulo', role: 'Instrutor de Formação Profissional' },
]

const education = [
  'Especialização em Inteligência Artificial e Tecnologias Educacionais',
  'Especialização em Engenharia de Software',
  'Especialização em Cibersegurança',
  'Especialização em Projetos de Aplicativos Móveis Multiplataforma',
  'Tecnologia em Sistemas para Internet — IFSP',
]

const navItems = [
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#projetos', label: 'Projetos' },
  { href: '#trajetoria', label: 'Trajetória' },
]

function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight
        const progress = total > 0 ? window.scrollY / total : 0
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showScene, setShowScene] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 260))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = schedule(() => setShowScene(true))
    return () => cancel(id)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div className="site-shell">
      <ScrollProgress />
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Igor Cacerez — início" onClick={() => setMenuOpen(false)}>
          Igor Cacerez
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav id="menu-principal" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <a className="nav-contact" href="#contato" onClick={() => setMenuOpen(false)}>
            Contato
          </a>
        </nav>
      </header>

      <main id="conteudo">
        <section id="inicio" className="hero" aria-labelledby="hero-title">
          <div className="hero-index" aria-hidden="true">
            <span>01</span>
            <i />
            <small>04</small>
          </div>
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Transformo</span>
              <span>complexidade em</span>
              <span>produtos digitais</span>
              <span>
                inteligentes<span className="accent-dot">.</span>
              </span>
            </h1>
            <p>
              Desenvolvimento full-stack, consultoria em IA e educação tecnológica para ideias que precisam sair do
              papel — e funcionar de verdade.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                Vamos construir algo <ArrowUpRight aria-hidden="true" />
              </a>
              <a className="button button-secondary" href="#projetos">
                Ver projetos <ArrowDownRight aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="knot-fallback">
              <i />
              <i />
              <i />
            </div>
            {showScene ? (
              <Suspense fallback={null}>
                <HeroScene />
              </Suspense>
            ) : null}
          </div>
          <div className="hero-diagonal" aria-hidden="true" />
          <a className="next-section" href="#especialidades">
            <span>02</span>
            <span>Especialidades</span>
            <ArrowDownRight aria-hidden="true" />
          </a>
        </section>

        <section id="especialidades" className="section services-section" aria-labelledby="services-title">
          <div className="section-heading">
            <div className="section-number" aria-hidden="true">02</div>
            <Reveal className="section-intro">
              <p className="section-label">Serviços</p>
              <h2 id="services-title">
                Estratégia, código e conhecimento no mesmo projeto<span className="accent-dot">.</span>
              </h2>
              <p>
                Da descoberta à entrega, combino visão de produto, engenharia full-stack e IA aplicada para resolver o
                problema certo — com clareza para quem decide e qualidade para quem usa.
              </p>
            </Reveal>
            <div className="services-watermark" aria-hidden="true">
              AI<br />CODE<br />TEACH
            </div>
          </div>

          <div className="service-list">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Reveal key={service.number} delay={index * 70}>
                  <article className="service-row">
                    <span className="service-number">{service.number}</span>
                    <Icon className="service-icon" strokeWidth={1.4} aria-hidden="true" />
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <a href="#contato" aria-label={`Conversar sobre ${service.title}`}>
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </section>

        <aside className="manifesto" aria-label="Princípio de trabalho">
          <p>Planejar <span>•</span> Construir <span>•</span> Ensinar</p>
          <strong>Boas soluções parecem simples porque a complexidade foi bem resolvida.</strong>
        </aside>

        <section id="projetos" className="section projects-section" aria-labelledby="projects-title">
          <div className="section-heading projects-heading">
            <div className="section-number" aria-hidden="true">03</div>
            <Reveal className="section-intro">
              <p className="section-label">Portfólio selecionado</p>
              <h2 id="projects-title">
                Produtos reais.<br />Problemas resolvidos<span className="accent-dot">.</span>
              </h2>
              <p>Estratégia, design e engenharia trabalhando juntos — do primeiro fluxo à operação em produção.</p>
            </Reveal>
          </div>

          <div className="case-list">
            <Reveal>
              <article className="case-study">
                <a className="case-media" href="https://food.cognisa.com.br" target="_blank" rel="noreferrer" aria-label="Visitar Cognisa Food">
                  <img
                    src="/portfolio/cognisa-food.webp"
                    width="1680"
                    height="760"
                    loading="lazy"
                    decoding="async"
                    alt="Página inicial do Cognisa Food, sistema para restaurantes, mesas e delivery"
                  />
                  <span className="case-visit">Abrir projeto <ArrowUpRight aria-hidden="true" /></span>
                </a>
                <div className="case-copy">
                  <span className="case-index">01 / 02</span>
                  <h3>Cognisa Food</h3>
                  <p>SaaS para restaurante, salão, cozinha e delivery em uma operação integrada.</p>
                  <ul aria-label="Áreas do projeto">
                    <li>Produto</li>
                    <li>Full-stack</li>
                    <li>UX</li>
                    <li>Operação</li>
                  </ul>
                  <a className="text-link" href="https://food.cognisa.com.br" target="_blank" rel="noreferrer">
                    Visitar projeto <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </article>
            </Reveal>

            <Reveal>
              <article className="case-study case-study-reverse">
                <div className="case-copy">
                  <span className="case-index">02 / 02</span>
                  <h3>Kalorias</h3>
                  <p>Plataforma de hábitos e nutrição com IA, comunidade e experiência PWA.</p>
                  <ul aria-label="Áreas do projeto">
                    <li>IA aplicada</li>
                    <li>PWA</li>
                    <li>Produto</li>
                    <li>Bem-estar</li>
                  </ul>
                  <a className="text-link" href="https://kalorias.com.br" target="_blank" rel="noreferrer">
                    Visitar projeto <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
                <a className="case-media" href="https://kalorias.com.br" target="_blank" rel="noreferrer" aria-label="Visitar Kalorias">
                  <img
                    src="/portfolio/kalorias.webp"
                    width="1536"
                    height="680"
                    loading="lazy"
                    decoding="async"
                    alt="Página inicial do Kalorias, plataforma gratuita de calorias e hábitos com inteligência artificial"
                  />
                  <span className="case-visit">Abrir projeto <ArrowUpRight aria-hidden="true" /></span>
                </a>
              </article>
            </Reveal>
          </div>
        </section>

        <section id="trajetoria" className="section trajectory-section" aria-labelledby="trajectory-title">
          <div className="section-heading trajectory-heading">
            <div className="section-number" aria-hidden="true">04</div>
            <Reveal className="section-intro">
              <p className="section-label">Trajetória & formação</p>
              <h2 id="trajectory-title">
                Experiência de quem constrói. Didática de quem ensina<span className="accent-dot">.</span>
              </h2>
              <p>Mais de uma década conectando tecnologia, produto e aprendizagem — da agência e do SaaS à sala de aula.</p>
            </Reveal>
          </div>

          <div className="trajectory-grid">
            <Reveal className="career-column">
              <h3>Experiência</h3>
              <ol className="timeline">
                {experiences.map((experience) => (
                  <li key={experience.company}>
                    <time>{experience.period}</time>
                    <strong>{experience.company}</strong>
                    <span>{experience.role}</span>
                  </li>
                ))}
              </ol>
              <div className="publications">
                <span>Publicações</span>
                <p>Dominando o CSS: um guia completo para desenvolvedores web</p>
                <p>JavaScript: fundamentos, técnicas e aplicações práticas</p>
              </div>
            </Reveal>

            <Reveal className="education-column" delay={100}>
              <div className="education-title">
                <h3>Formação concluída</h3>
                <span aria-hidden="true">05</span>
              </div>
              <ol>
                {education.map((course, index) => (
                  <li key={course}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{course}</p>
                  </li>
                ))}
              </ol>
              <p className="continuous-learning">
                Certificações em Three.js e WebGL, Next.js, Clean Code, Object Calisthenics e Python orientado a objetos.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="contato" className="contact-section" aria-labelledby="contact-title">
          <Reveal>
            <p className="section-label">Próximo projeto</p>
            <h2 id="contact-title">Tem um desafio em mente?</h2>
            <p>Vamos transformar essa ideia em um produto claro, útil e pronto para crescer.</p>
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <span>
                Conversar no WhatsApp
                <small>18 99649-6255</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Reveal>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#inicio" aria-label="Voltar ao início">
          Igor Cacerez
        </a>
        <p>Desenvolvimento full-stack, IA aplicada e educação tecnológica.</p>
        <div>
          <a href="https://www.linkedin.com/in/igorcacerez" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="#inicio">Voltar ao topo ↑</a>
        </div>
        <small>© {new Date().getFullYear()} Igor Cacerez</small>
      </footer>
    </div>
  )
}

export default App
