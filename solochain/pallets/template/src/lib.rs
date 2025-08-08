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
	use frame_support::sp_runtime::{Saturating, Permill};
	use frame_support::traits::{ReservableCurrency, Currency};


	pub type ProposalId = u32;
	pub type BalanceOf<T> =
    	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;


	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen,DecodeWithMemTracking)]
	pub enum ProposalStatus {
		Active,
		Approved,	
		Rejected,
		Cancelled,
	}

	#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen,DecodeWithMemTracking)]
	pub enum VoteKind {
		For,
		Against,
	}

	#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen, DecodeWithMemTracking)]
	pub enum Coin {
		Dot,
		Kusama,
		Usdc,
		Centrifuge,
	}

	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen, DecodeWithMemTracking)]
	pub struct Swap {
		pub from: Coin,
		pub to: Coin,
		pub amount: u128,
	}

	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen, DecodeWithMemTracking)]
	pub enum Action {
		Swap(Swap),
	}

	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct Proposal<T:Config>
	where
		T::AccountId: MaxEncodedLen,
		BalanceOf<T>: MaxEncodedLen,
	{
		pub id: ProposalId,
		pub author: T::AccountId,
		pub title: BoundedVec<u8, T::MaxTitleLen>,         
		pub description: BoundedVec<u8, T::MaxDescriptionLen>, 
		pub start: BlockNumberFor<T>,
		pub end: BlockNumberFor<T>,                        
		pub for_votes: BalanceOf<T>,
    	pub against_votes: BalanceOf<T>,
		pub status: ProposalStatus,
		pub action: Action,
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
		
		type Currency: ReservableCurrency<Self::AccountId>;

		type Quorum: Get<Permill>;
		type ApprovalOfQuorum: Get<Permill>;

		type KarmaUnit: Get<BalanceOf<Self>>;
	}

	#[pallet::storage]
	#[pallet::getter(fn proposals)]
	pub type Proposals<T: Config> = StorageMap<
		_,
		Blake2_128Concat,
		ProposalId,
		Proposal<T>,
		OptionQuery
	>;

	#[pallet::storage]
	#[pallet::getter(fn next_proposal_id)]
	pub type NextProposalId<T> = StorageValue<_, ProposalId, ValueQuery>;

	#[pallet::storage]
	#[pallet::getter(fn deposits)]
	pub type Deposits<T: Config> =
    StorageMap<_, Blake2_128Concat, T::AccountId, BalanceOf<T>, ValueQuery>;

	#[pallet::storage]
	#[pallet::getter(fn has_voted)]
	pub type HasVoted<T: Config> = StorageDoubleMap<
		_,
		Blake2_128Concat, ProposalId,
		Blake2_128Concat, T::AccountId,
		bool,
		ValueQuery
	>;
	#[pallet::storage]
	#[pallet::getter(fn total_stake)]
	pub type TotalStake<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

	#[pallet::storage]
	#[pallet::getter(fn karma)]
	pub type Karma<T: Config> =
    	StorageMap<_, Blake2_128Concat, T::AccountId, u32, ValueQuery>;

	#[pallet::storage]
	#[pallet::getter(fn vault)]
	pub type Vault<T> = StorageMap<_, Blake2_128Concat, Coin, u128, ValueQuery>;

	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		ProposalCreated {
			id: ProposalId,
			author: T::AccountId,
    	},
		ProposalVoted {
			id: ProposalId,
			voter: T::AccountId,
			vote: VoteKind,
    	},
		ProposalFinalized {
			id: ProposalId,
			status: ProposalStatus,
		},
		Deposited { 
			who: T::AccountId, 
			amount: BalanceOf<T> 
		},
		Withdrawn { 
			who: T::AccountId, 
			amount: BalanceOf<T> 
		},
		SwapExecuted { 
			from: Coin, 
			to: Coin, 
			amount: u128, 
			proposal_id: ProposalId 
		},
    	VaultSeeded { 
			coin: Coin, 
			amount: u128 
		},
	}	

	#[pallet::error]
	pub enum Error<T> {
		NoneValue,
		StorageOverflow,
		DurationTooShort,
		DurationTooLong,
		ProposalNotFound,
		ProposalNotActive,
		VotingPeriodEnded,
		AlreadyVoted,
		NoDeposit,            
		WithdrawTooLarge,
		QuorumNotMet,
		InsufficientVaultBalance,
    	InvalidSwap,
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
			action: Action,
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

			let proposal = Proposal::<T> {
				id,
				author: who.clone(),
				title: title_b,
				description: desc_b,
				start: now,
				end,
				for_votes: Zero::zero(),
				against_votes: Zero::zero(),
				status: ProposalStatus::Active,
				action
			};

			Proposals::<T>::insert(id, proposal);
			NextProposalId::<T>::put(id.checked_add(1).ok_or(Error::<T>::StorageOverflow)?);

			Self::deposit_event(Event::<T>::ProposalCreated { id, author: who });
			Ok(())
		}
		
		#[pallet::call_index(1)]
		#[pallet::weight(10_000)]
		pub fn vote_proposal(
			origin: OriginFor<T>,
			proposal_id: ProposalId,
			vote: VoteKind,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			Proposals::<T>::try_mutate(proposal_id, |maybe_proposal| -> Result<(), Error<T>> {
				let proposal = maybe_proposal.as_mut().ok_or(Error::<T>::ProposalNotFound)?;

				ensure!(proposal.status == ProposalStatus::Active, Error::<T>::ProposalNotActive);

				let now: BlockNumberFor<T> = <frame_system::Pallet<T>>::block_number();
				ensure!(now <= proposal.end, Error::<T>::VotingPeriodEnded);

				ensure!(
					!HasVoted::<T>::get(proposal_id, &who),
					Error::<T>::AlreadyVoted
				);

				let stake = Deposits::<T>::get(&who);
				let karma_pts: u32 = Karma::<T>::get(&who);
				let karma_weight: BalanceOf<T> =
					T::KarmaUnit::get().saturating_mul(BalanceOf::<T>::from(karma_pts));

				let weight = stake.saturating_add(karma_weight);
				ensure!(!weight.is_zero(), Error::<T>::NoDeposit);

				match vote {
					VoteKind::For => proposal.for_votes = proposal.for_votes.saturating_add(weight),
					VoteKind::Against => proposal.against_votes = proposal.against_votes.saturating_add(weight),
				}

				match vote {
					VoteKind::For => proposal.for_votes = proposal.for_votes.saturating_add(One::one()),
					VoteKind::Against => proposal.against_votes = proposal.against_votes.saturating_add(One::one()),
				}

				HasVoted::<T>::insert(proposal_id, &who, true);

				Ok(())
			})?;

			Self::deposit_event(Event::<T>::ProposalVoted {
				id: proposal_id,
				voter: who,
				vote,
			});

			Ok(())
		}

		#[pallet::call_index(2)]
		#[pallet::weight(10_000)]
		pub fn finalize_proposal(
			origin: OriginFor<T>,
			proposal_id: ProposalId,
		) -> DispatchResult {
			let _who = ensure_signed(origin)?;

			Proposals::<T>::try_mutate(proposal_id, |maybe_proposal| -> Result<(), Error<T>> {
				let proposal = maybe_proposal.as_mut().ok_or(Error::<T>::ProposalNotFound)?;

				ensure!(proposal.status == ProposalStatus::Active, Error::<T>::ProposalNotActive);

				let now: BlockNumberFor<T> = <frame_system::Pallet<T>>::block_number();
				ensure!(now < proposal.end, Error::<T>::VotingPeriodEnded);

				let total = TotalStake::<T>::get();
				let participation = proposal.for_votes.saturating_add(proposal.against_votes);

				let min_participation = T::Quorum::get().mul_floor(total);
				ensure!(participation >= min_participation, Error::<T>::QuorumNotMet);

				let needed_for = T::ApprovalOfQuorum::get().mul_floor(participation);

				proposal.status = if proposal.for_votes >= needed_for {
					proposal.status = ProposalStatus::Approved;

					 match &proposal.action {
						Action::Swap(Swap { from, to, amount }) => {
							ensure!(from != to, Error::<T>::InvalidSwap);
							let from_bal = Vault::<T>::get(*from);
							ensure!(from_bal >= *amount, Error::<T>::InsufficientVaultBalance);

							Vault::<T>::insert(*from, from_bal - *amount);
							Vault::<T>::mutate(*to, |b| *b = b.saturating_add(*amount));

							Self::deposit_event(Event::<T>::SwapExecuted {
								from: *from, to: *to, amount: *amount, proposal_id
							});
						}
					}

					let author = proposal.author.clone();
					Karma::<T>::mutate(&author, |k| *k = k.saturating_add(1));
					ProposalStatus::Approved
				} else {
					ProposalStatus::Rejected
				};

				Ok(())
			})?;

			Self::deposit_event(Event::<T>::ProposalFinalized {
				id: proposal_id,
				status: Proposals::<T>::get(proposal_id).unwrap().status,
			});

			Ok(())
}

		#[pallet::call_index(3)]
		#[pallet::weight(10_000)]
		pub fn deposit(origin: OriginFor<T>, amount: BalanceOf<T>) -> DispatchResult {
			let who = ensure_signed(origin)?;
			T::Currency::reserve(&who, amount)?;
			Deposits::<T>::mutate(&who, |b| *b = b.saturating_add(amount));
			TotalStake::<T>::mutate(|t| *t = t.saturating_add(amount));
			Self::deposit_event(Event::Deposited { who, amount });
			Ok(())
		}

		#[pallet::call_index(4)]
		#[pallet::weight(10_000)]
		pub fn withdraw(origin: OriginFor<T>, amount: BalanceOf<T>) -> DispatchResult {
			let who = ensure_signed(origin)?;
			let staked = Deposits::<T>::get(&who);
			ensure!(amount <= staked, Error::<T>::WithdrawTooLarge);

			let _unreserved = T::Currency::unreserve(&who, amount);
			Deposits::<T>::mutate(&who, |b| *b = b.saturating_sub(amount));
			TotalStake::<T>::mutate(|t| *t = t.saturating_sub(amount));
			Self::deposit_event(Event::Withdrawn { who, amount });
			Ok(())
		}

		#[pallet::call_index(5)]
		#[pallet::weight(10_000)]
		pub fn seed_vault(origin: OriginFor<T>, coin: Coin, amount: u128) -> DispatchResult {
			Vault::<T>::mutate(coin, |b| *b = b.saturating_add(amount));
			Self::deposit_event(Event::VaultSeeded { coin, amount });
			Ok(())
		}

	}
}
