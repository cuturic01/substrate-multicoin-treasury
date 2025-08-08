#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
pub mod weights;
pub use weights::*;

#[frame_support::pallet]
pub mod pallet {
	use super::*;
	use frame_support::pallet_prelude::*;
	use frame_system::pallet_prelude::*;
	use frame_support::{BoundedVec, pallet_prelude::*};
	use frame_system::pallet_prelude::BlockNumberFor;
	use frame_support::sp_runtime::Saturating;

	pub type ProposalId = u32;

	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	pub enum ProposalStatus {
		Active,
		Approved,	
		Rejected,
		Cancelled,
	}

	#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	pub enum VoteKind {
		For,
		Against,
	}

	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct Proposal<T:Config>
	where
		T::AccountId: MaxEncodedLen,
	{
		pub id: ProposalId,
		pub author: T::AccountId,
		pub title: BoundedVec<u8, T::MaxTitleLen>,         
		pub description: BoundedVec<u8, T::MaxDescriptionLen>, 
		pub start: BlockNumberFor<T>,
		pub end: BlockNumberFor<T>,                        
		pub for_votes: u32,
		pub against_votes: u32,
		pub status: ProposalStatus,
	}

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	#[pallet::config]
	pub trait Config: frame_system::Config {
		type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
		type WeightInfo: WeightInfo;
		type MaxTitleLen: Get<u32>;
		type MaxDescriptionLen: Get<u32>;
		type MinProposalDuration: Get<u32>;
		type MaxProposalDuration: Get<u32>;
	}

	#[pallet::storage]
	#[pallet::getter(fn proposals)]
	pub type Proposals<T: Config> = StorageMap<
		_,
		Blake2_128Concat,    // hasher za ključ
		ProposalId,          // tip ključa
		Proposal<T>,         // tip vrednosti (struct Proposal<T>)
		OptionQuery          // vrednost se vraća kao Option<Proposal<T>>
	>;

	#[pallet::storage]
	#[pallet::getter(fn next_proposal_id)]
	pub type NextProposalId<T> = StorageValue<_, ProposalId, ValueQuery>;

	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		ProposalCreated {
			id: ProposalId,
			author: T::AccountId,
    	},
	}

	#[pallet::error]
	pub enum Error<T> {
		NoneValue,
		StorageOverflow,
		DurationTooShort,
    	DurationTooLong,
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {		
		
		#[pallet::call_index(0)]
		#[pallet::weight(10_000)]
		pub fn create_proposal(
			origin: OriginFor<T>,
			title: BoundedVec<u8, T::MaxTitleLen>,
			description: BoundedVec<u8, T::MaxDescriptionLen>,
			duration: u32,
		) -> DispatchResult {

			let who = ensure_signed(origin)?;

			ensure!(duration >= T::MinProposalDuration::get(), Error::<T>::DurationTooShort);
			ensure!(duration <= T::MaxProposalDuration::get(), Error::<T>::DurationTooLong);

			let title_b: BoundedVec<_, T::MaxTitleLen> =
				title.try_into().map_err(|_| Error::<T>::StorageOverflow)?;
			let desc_b: BoundedVec<_, T::MaxDescriptionLen> =
				description.try_into().map_err(|_| Error::<T>::StorageOverflow)?;

			let id = NextProposalId::<T>::get();
			let now: BlockNumberFor<T> = <frame_system::Pallet<T>>::block_number();
			let duration_bn: BlockNumberFor<T> = duration.into();
			let end = now.saturating_add(duration_bn);

			// Napravi strukturu direktno
			let proposal = Proposal::<T> {
				id,
				author: who.clone(),
				title: title_b,
				description: desc_b,
				start: now,
				end,
				for_votes: 0,
				against_votes: 0,
				status: ProposalStatus::Active,
			};

			Proposals::<T>::insert(id, proposal);
			NextProposalId::<T>::put(id.checked_add(1).ok_or(Error::<T>::StorageOverflow)?);

			Self::deposit_event(Event::<T>::ProposalCreated { id, author: who });

			Ok(())
		}


	}
}
