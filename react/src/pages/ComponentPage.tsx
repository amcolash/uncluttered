import type { ChangeEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { photos } from 'utilities/photos';

import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from 'components/ui/Card';
import { Checkbox } from 'components/ui/Checkbox';
import { EmptyState } from 'components/ui/EmptyState';
import { Input } from 'components/ui/Input';
import { Modal } from 'components/ui/Modal';
import { PageHeader } from 'components/ui/PageHeader';
import { Progress } from 'components/ui/Progress';
import { RadioGroup } from 'components/ui/Radio';
import { Select, type SelectOption } from 'components/ui/Select';
import { Spinner } from 'components/ui/Spinner';
import { Textarea } from 'components/ui/Textarea';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gap-md flex flex-col">
      <h2 className="border-border-subtle pb-xs text-text-primary border-b text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, center, children }: { label?: string; center?: boolean; children: ReactNode }) {
  return (
    <div className="gap-xs flex flex-col">
      {label && <p className="text-text-muted text-xs font-bold tracking-wider uppercase">{label}</p>}
      <div className={`gap-sm flex flex-wrap ${center ? 'items-center' : 'items-start'}`}>{children}</div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

const fruits: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'mango', label: 'Mango' },
];

const planOptions = [
  { value: 'starter', label: 'Starter', description: 'Perfect for small projects' },
  { value: 'pro', label: 'Pro', description: 'For growing teams' },
  { value: 'enterprise', label: 'Enterprise', description: 'Custom everything', disabled: true },
];

const sizeOptions = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

export function ComponentPage() {
  const navigate = useNavigate();
  const [radioPlan, setRadioPlan] = useState('starter');
  const [radioSize, setRadioSize] = useState('md');
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [cards, setCards] = useState(photos);

  return (
    <div className="bg-surface-canvas px-md py-lg sm:px-xl sm:py-2xl min-h-screen">
      <div className="gap-xl mx-auto flex max-w-4xl flex-col">
        {/* Header */}
        <PageHeader
          title="Component Library"
          badge={{ label: 'Design Tokens v4', variant: 'primary' }}
          description="Demonstration of all unified design tokens, typography, surfaces, and shared UI components."
          actions={
            <div className="gap-xs flex items-center">
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                Back to App
              </Button>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                Open Demo Modal
              </Button>
            </div>
          }
        />

        {/* ── Demo Modal ─────────────────────────────────────── */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Demo Animated Modal" size="md">
          <div className="gap-md text-text-secondary flex flex-col text-sm">
            <p>
              This modal uses <code className="text-text-primary">motion/react</code> spring physics, automatic body
              scroll locking, escape key listeners, and backdrop blur.
            </p>
            <div className="gap-xs pt-md flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── SwipeCard ───────────────────────────────────────── */}
        <Section title="SwipeCard">
          <Button variant="primary" className="w-fit" onClick={() => setCards(photos)}>
            Reset cards
          </Button>

          <CardStack>
            {cards.map((card, i) => (
              <SwipeCard
                key={card.id}
                onSwipe={(_dir) => {
                  setCards((prev) => prev.filter((c) => c.id !== card.id));
                }}
                index={i}
              >
                <img
                  src={card.url}
                  alt={`Photo ${card.id}`}
                  className="rounded-card h-full w-full object-cover"
                  draggable={false}
                />
              </SwipeCard>
            ))}
          </CardStack>
        </Section>

        {/* ── Button ──────────────────────────────────────────── */}
        <Section title="Button">
          <Row label="Variants" center>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row label="Sizes" center>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row label="States" center>
            <Button loading>Loading</Button>
            <Button variant="secondary" loading>
              Loading
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>
        </Section>

        {/* ── Badge ───────────────────────────────────────────── */}
        <Section title="Badge">
          <Row center>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="outline">Outline</Badge>
          </Row>
        </Section>

        {/* ── Spinner ─────────────────────────────────────────── */}
        <Section title="Spinner">
          <Row center>
            <Spinner size="sm" className="text-text-muted" />
            <Spinner size="md" className="text-brand-primary" />
            <Spinner size="lg" className="text-status-success" />
          </Row>
        </Section>

        {/* ── Progress ────────────────────────────────────────── */}
        <Section title="Progress">
          <Row label="Variants">
            <div className="gap-sm flex w-full flex-col">
              <Progress value={65} label="Default" showValue />
              <Progress value={80} variant="success" label="Success" showValue />
              <Progress value={45} variant="warning" label="Warning" showValue />
              <Progress value={30} variant="danger" label="Danger" showValue />
            </div>
          </Row>
          <Row label="Sizes">
            <div className="gap-sm flex w-full flex-col">
              <Progress value={60} size="sm" label="Small (h-1)" />
              <Progress value={60} size="md" label="Medium (h-2)" />
              <Progress value={60} size="lg" label="Large (h-3)" />
            </div>
          </Row>
        </Section>

        {/* ── Input ───────────────────────────────────────────── */}
        <Section title="Input">
          <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
            <Input label="Default" placeholder="Enter text…" />
            <Input label="With hint" placeholder="user@example.com" hint="We'll never share your email." />
            <Input
              label="With error"
              placeholder="Enter text…"
              defaultValue="bad value"
              error="This field is required."
            />
            <Input label="With start icon" placeholder="Search…" startIcon={<SearchIcon />} />
            <Input label="With end icon" placeholder="Enter email…" endIcon={<MailIcon />} />
            <Input label="Disabled" placeholder="Not editable" disabled />
          </div>
        </Section>

        {/* ── Textarea ────────────────────────────────────────── */}
        <Section title="Textarea">
          <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
            <Textarea label="Default" placeholder="Write something…" rows={3} />
            <Textarea label="With hint" placeholder="Describe your project…" hint="Max 500 characters." rows={3} />
            <Textarea
              label="With error"
              placeholder="Required field"
              defaultValue="invalid input"
              error="This field cannot be empty."
              rows={3}
            />
            <Textarea label="Disabled" placeholder="Not editable" disabled rows={3} />
          </div>
        </Section>

        {/* ── Select ──────────────────────────────────────────── */}
        <Section title="Select">
          <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
            <Select label="Default" options={fruits} defaultValue="apple" />
            <Select label="With placeholder" options={fruits} placeholder="Choose a fruit…" />
            <Select label="With hint" options={fruits} defaultValue="banana" hint="Select your favourite fruit." />
            <Select label="With error" options={fruits} placeholder="Choose…" error="Please select an option." />
            <Select label="Disabled" options={fruits} defaultValue="cherry" disabled />
          </div>
        </Section>

        {/* ── Radio ───────────────────────────────────────────── */}
        <Section title="Radio">
          <div className="gap-lg grid grid-cols-1 sm:grid-cols-2">
            <RadioGroup
              name="plan"
              label="With descriptions"
              value={radioPlan}
              onChange={setRadioPlan}
              options={planOptions}
            />
            <RadioGroup
              name="size-h"
              label="Horizontal orientation"
              value={radioSize}
              onChange={setRadioSize}
              orientation="horizontal"
              options={sizeOptions}
            />
          </div>
        </Section>

        {/* ── Checkbox ────────────────────────────────────────── */}
        <Section title="Checkbox">
          <div className="gap-xs grid grid-cols-1 sm:grid-cols-2">
            <Checkbox
              label="Unchecked"
              checked={check1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheck1(e.target.checked)}
            />
            <Checkbox
              label="Checked"
              checked={check2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheck2(e.target.checked)}
            />
            <Checkbox
              label="With description"
              description="Some extra context below the label."
              checked={check3}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheck3(e.target.checked)}
            />
            <Checkbox label="Disabled unchecked" disabled />
          </div>
        </Section>

        {/* ── Card ────────────────────────────────────────────── */}
        <Section title="Card">
          <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>A basic card with a header and body.</CardDescription>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary text-sm">Card content goes here using semantic tokens.</p>
              </CardBody>
            </Card>
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover glow and border feedback.</CardDescription>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary text-sm">Clickable card with smooth transition.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm">Save changes</Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>
        {/* ── EmptyState ────────────────────────────────────── */}
        <Section title="EmptyState">
          <EmptyState
            icon="🎉"
            title="All done — zero pending items!"
            description="All reviews and operations are fully up to date."
            action={
              <Button variant="primary" size="sm">
                Refresh View
              </Button>
            }
          />
        </Section>
      </div>
    </div>
  );
}
