import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Plant } from '@/types/plants';
import PlantPicker from './PlantPicker';

const schema = z.object({ plant: z.string() });

function TestWrapper({ plants }: { plants: Plant[] }) {
  const { control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { plant: '' },
  });
  return <PlantPicker control={control} name="plant" plants={plants} />;
}

const mockPlants: Plant[] = [
  {
    id: 'p1',
    commonName: 'Tomato',
    category: 'vegetable',
    scientificName: '',
    description: '',
    defaultSpacingFt: null,
  },
  {
    id: 'p2',
    commonName: 'Basil',
    category: 'herb',
    scientificName: '',
    description: '',
    defaultSpacingFt: null,
  },
  {
    id: 'p3',
    commonName: 'Sunflower',
    category: 'flower',
    scientificName: '',
    description: '',
    defaultSpacingFt: null,
  },
];

describe('PlantPicker', () => {
  it('renders all plants in the list', () => {
    render(<TestWrapper plants={mockPlants} />);
    expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /basil/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sunflower/i }),
    ).toBeInTheDocument();
  });

  it('shows "None selected" when no plant is chosen', () => {
    render(<TestWrapper plants={mockPlants} />);
    expect(screen.getByText('None selected')).toBeInTheDocument();
  });

  it('hides "None selected" and shows the selection chip after selection', async () => {
    const user = userEvent.setup();
    render(<TestWrapper plants={mockPlants} />);

    await user.click(screen.getByRole('button', { name: /tomato/i }));

    expect(screen.queryByText('None selected')).not.toBeInTheDocument();
  });

  it('filters plants by search text', async () => {
    const user = userEvent.setup();
    render(<TestWrapper plants={mockPlants} />);

    await user.type(screen.getByPlaceholderText(/search plants/i), 'bas');

    expect(screen.getByRole('button', { name: /basil/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /tomato/i }),
    ).not.toBeInTheDocument();
  });

  it('shows "No plants found" when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<TestWrapper plants={mockPlants} />);

    await user.type(screen.getByPlaceholderText(/search plants/i), 'zzz');

    expect(screen.getByText(/no plants found/i)).toBeInTheDocument();
  });

  it('filters by category when a category chip is clicked', async () => {
    const user = userEvent.setup();
    render(<TestWrapper plants={mockPlants} />);

    await user.click(screen.getByRole('button', { name: /^herb$/i }));

    expect(screen.getByRole('button', { name: /basil/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /tomato/i }),
    ).not.toBeInTheDocument();
  });

  it('resets to all plants when the All chip is clicked', async () => {
    const user = userEvent.setup();
    render(<TestWrapper plants={mockPlants} />);

    await user.click(screen.getByRole('button', { name: /^herb$/i }));
    await user.click(screen.getByRole('button', { name: /^all$/i }));

    expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /basil/i })).toBeInTheDocument();
  });
});
