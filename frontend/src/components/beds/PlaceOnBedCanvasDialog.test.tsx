import React from 'react';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockUserPlant } from '@/test/fixtures';
import { createUserPlant } from '@/api/plants';
import PlaceOnBedCanvasDialog from './PlaceOnBedCanvasDialog';

vi.mock('@/api/plants', () => ({ createUserPlant: vi.fn(), fetchPlants: vi.fn().mockResolvedValue([]) }));
vi.mock('@/components/plants/UserPlantForm', () => ({
  default: ({ onSubmit, children }: { onSubmit: () => void; children: React.ReactNode }) => (
    <div>
      {children}
      <button onClick={() => onSubmit({} as never)}>Add</button>
    </div>
  ),
}));
vi.mock('@/lib/features', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/features')>();
  return { ...mod, featureImage: () => null };
});

const onPlace = vi.fn();
const onPlaceFeature = vi.fn();
const onOpenChange = vi.fn();

function renderDialog({ unplacedPlants = [mockUserPlant] } = {}) {
  return render(
    <PlaceOnBedCanvasDialog
      open
      onOpenChange={onOpenChange}
      cell={{ x: 1, y: 0 }}
      gardenId="garden-1"
      bedId="bed-1"
      unplacedPlants={unplacedPlants}
      onPlace={onPlace}
      isPlacing={false}
      onPlaceFeature={onPlaceFeature}
    />,
  );
}

describe('PlaceOnBedCanvasDialog', () => {
  describe('choose step', () => {
    it('shows the two placement options', () => {
      renderDialog();
      expect(screen.getByRole('heading', { name: /add to bed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place a plant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place a feature/i })).toBeInTheDocument();
    });

    it('navigates to the plant step', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a plant/i }));
      expect(screen.getByRole('heading', { name: /add plant/i })).toBeInTheDocument();
    });

    it('navigates to the feature step', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a feature/i }));
      expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
    });
  });

  describe('plant-pick step', () => {
    async function openPlantStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a plant/i }));
      return user;
    }

    it('shows unplaced plants', async () => {
      await openPlantStep();
      expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
    });

    it('shows "no unplaced plants" message when list is empty', async () => {
      const user = userEvent.setup();
      render(
        <PlaceOnBedCanvasDialog
          open
          onOpenChange={onOpenChange}
          cell={{ x: 0, y: 0 }}
          gardenId="garden-1"
          bedId="bed-1"
          unplacedPlants={[]}
          onPlace={onPlace}
          isPlacing={false}
          onPlaceFeature={onPlaceFeature}
        />,
      );
      await user.click(screen.getByRole('button', { name: /place a plant/i }));
      expect(screen.getByText(/no unplaced plants/i)).toBeInTheDocument();
    });

    it('calls onPlace when a plant is clicked', async () => {
      const user = await openPlantStep();
      await user.click(screen.getByRole('button', { name: /tomato/i }));
      expect(onPlace).toHaveBeenCalledWith('plant-1');
    });

    it('shows the "Add new plant" button', async () => {
      await openPlantStep();
      expect(screen.getByRole('button', { name: /add new plant/i })).toBeInTheDocument();
    });

    it('goes back to the choose step via the Back button', async () => {
      const user = await openPlantStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /add to bed/i })).toBeInTheDocument();
    });
  });

  describe('plant-create step', () => {
    async function openCreateStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a plant/i }));
      await user.click(screen.getByRole('button', { name: /add new plant/i }));
      return user;
    }

    it('shows the create form with Add Plant title', async () => {
      await openCreateStep();
      expect(screen.getByRole('heading', { name: /add plant/i })).toBeInTheDocument();
    });

    it('goes back to the plant-pick step via the Back button', async () => {
      const user = await openCreateStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /add plant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new plant/i })).toBeInTheDocument();
    });

    it('creates a plant and calls onPlace on successful submit', async () => {
      vi.mocked(createUserPlant).mockResolvedValue([mockUserPlant]);
      const user = await openCreateStep();
      await user.click(screen.getByRole('button', { name: /^add$/i }));
      await waitFor(() => expect(onPlace).toHaveBeenCalledWith('plant-1'));
    });
  });

  describe('feature step', () => {
    async function openFeatureStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a feature/i }));
      return user;
    }

    it('shows the feature type picker with bed-scoped types', async () => {
      await openFeatureStep();
      expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tomato cage/i })).toBeInTheDocument();
    });

    it('does not show garden-only types', async () => {
      await openFeatureStep();
      expect(screen.queryByRole('button', { name: /^shed$/i })).not.toBeInTheDocument();
    });

    it('goes back to the choose step via the Back button', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /add to bed/i })).toBeInTheDocument();
    });

    it('calls onPlaceFeature when a type is selected and Add is clicked', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /trellis/i }));
      await user.click(screen.getByRole('button', { name: /^add$/i }));
      expect(onPlaceFeature).toHaveBeenCalledWith('trellis', '');
    });
  });
});
