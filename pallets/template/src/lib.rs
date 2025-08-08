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
	use frame_system::pallet_prelude::*;
	use frame_system::pallet_prelude::BlockNumberFor;

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
	pub type Something<T> = StorageValue<_, u32>;
	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		SomethingStored {
			something: u32,
			who: T::AccountId,
		},
	}

	#[pallet::error]
	pub enum Error<T> {
		NoneValue,
		StorageOverflow,
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {		
		#[pallet::call_index(0)]
		#[pallet::weight(T::WeightInfo::do_something())]
		pub fn do_something(origin: OriginFor<T>, something: u32) -> DispatchResult {
			let who = ensure_signed(origin)?;

			Something::<T>::put(something);

			Self::deposit_event(Event::SomethingStored { something, who });

			Ok(())
		}

		#[pallet::call_index(1)]
		#[pallet::weight(T::WeightInfo::cause_error())]
		pub fn cause_error(origin: OriginFor<T>) -> DispatchResult {
			let _who = ensure_signed(origin)?;

			match Something::<T>::get() {
				None => Err(Error::<T>::NoneValue.into()),
				Some(old) => {
					let new = old.checked_add(1).ok_or(Error::<T>::StorageOverflow)?;
					Something::<T>::put(new);
					Ok(())
				},
			}
		}
	}
}
